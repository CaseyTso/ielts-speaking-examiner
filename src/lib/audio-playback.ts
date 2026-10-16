/**
 * audio-playback.ts
 * Schedules and streams 24kHz 16-bit PCM audio chunks from Gemini Live API,
 * with immediate queue flushing on user interruption.
 */

export interface AudioPlaybackOptions {
  onPlayingStateChange?: (isPlaying: boolean) => void;
  onError?: (error: Error) => void;
}

export class AudioPlaybackStreamer {
  private audioContext: AudioContext | null = null;
  private nextStartTime = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private isPlaying = false;
  private options: AudioPlaybackOptions;

  constructor(options: AudioPlaybackOptions = {}) {
    this.options = options;
  }

  public initContext(): AudioContext {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioContextClass({
        latencyHint: 'interactive',
      });
    }
    return this.audioContext;
  }

  /**
   * Initializes or returns the AudioContext and ensures it is resumed.
   * Should be called within a user gesture (e.g., button click) to satisfy iOS Safari autoplay policy.
   */
  public async resumeContext(): Promise<AudioContext> {
    const ctx = this.initContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    return ctx;
  }

  /**
   * Enqueues and plays a 24kHz 16-bit PCM audio chunk.
   */
  public enqueuePcmChunk(pcmData: Uint8Array | ArrayBuffer | string): void {
    try {
      const ctx = this.initContext();
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }

      // Convert raw input to Uint8Array
      let bytes: Uint8Array;
      if (typeof pcmData === 'string') {
        // Base64 decoded
        const binary = atob(pcmData);
        bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
      } else if (pcmData instanceof Uint8Array) {
        bytes = pcmData;
      } else {
        bytes = new Uint8Array(pcmData);
      }

      if (bytes.byteLength === 0) return;

      // 16-bit PCM -> Float32
      const sampleCount = Math.floor(bytes.byteLength / 2);
      if (sampleCount === 0) return;

      // Safe view even if unaligned
      const int16View = new Int16Array(
        bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + sampleCount * 2)
      );
      const float32 = new Float32Array(sampleCount);
      for (let i = 0; i < sampleCount; i++) {
        float32[i] = int16View[i] / 32768.0;
      }

      // Create 24000Hz AudioBuffer
      const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
      audioBuffer.copyToChannel(float32, 0);

      // Create source node
      const sourceNode = ctx.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(ctx.destination);

      const now = ctx.currentTime;
      // If nextStartTime is in the past, add 15ms buffer to prevent underruns
      const startTime = Math.max(now + 0.015, this.nextStartTime);
      sourceNode.start(startTime);
      this.nextStartTime = startTime + audioBuffer.duration;

      // Only push to activeSources if context is running to prevent leakage on suspended contexts
      if (ctx.state === 'running') {
        this.activeSources.push(sourceNode);
      }

      if (!this.isPlaying) {
        this.isPlaying = true;
        this.options.onPlayingStateChange?.(true);
      }

      sourceNode.onended = () => {
        const idx = this.activeSources.indexOf(sourceNode);
        if (idx !== -1) {
          this.activeSources.splice(idx, 1);
        }
        if (this.activeSources.length === 0) {
          // Check if queue has really drained
          if (!this.audioContext || this.audioContext.currentTime >= this.nextStartTime - 0.05) {
            this.isPlaying = false;
            this.options.onPlayingStateChange?.(false);
          }
        }
      };
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.options.onError?.(error);
    }
  }

  /**
   * Immediately interrupts and halts active playback, clearing scheduled audio.
   */
  public interrupt(): void {
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // ignore
      }
    }
    this.activeSources = [];
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.nextStartTime = this.audioContext.currentTime;
    } else {
      this.nextStartTime = 0;
    }

    if (this.isPlaying) {
      this.isPlaying = false;
      this.options.onPlayingStateChange?.(false);
    }
  }

  /**
   * Returns whether audio is currently playing.
   */
  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Cleans up and releases AudioContext resources.
   */
  public close(): void {
    this.interrupt();
    if (this.audioContext) {
      try {
        void this.audioContext.close();
      } catch {
        // ignore
      }
      this.audioContext = null;
    }
  }
}
