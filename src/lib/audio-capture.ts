/**
 * audio-capture.ts
 * Captures microphone audio, resamples to 16kHz 16-bit PCM (mono),
 * and emits chunks suitable for Gemini Live API streaming.
 */

export interface AudioCaptureOptions {
  onChunk: (chunk: Uint8Array) => void;
  onVolumeChange?: (volume: number) => void;
  onError?: (error: Error) => void;
}

const INLINE_PROCESSOR_CODE = `
class PCMRecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.targetSampleRate = 16000;
    this.sourceIndex = 0;
    this.chunkSize = 1600;
    this.outputBuffer = new Int16Array(this.chunkSize);
    this.outputOffset = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const ch = input[0];
    if (!ch || ch.length === 0) return true;

    if (sampleRate === this.targetSampleRate) {
      for (let i = 0; i < ch.length; i++) {
        const s = Math.max(-1, Math.min(1, ch[i]));
        this.outputBuffer[this.outputOffset++] = s < 0 ? s * 0x8000 : s * 0x7fff;
        if (this.outputOffset >= this.chunkSize) {
          const chunk = new Int16Array(this.outputBuffer);
          this.port.postMessage(chunk.buffer, [chunk.buffer]);
          this.outputOffset = 0;
        }
      }
    } else {
      const ratio = sampleRate / this.targetSampleRate;
      let inIdx = this.sourceIndex;
      while (inIdx < ch.length) {
        const i0 = Math.floor(inIdx);
        const i1 = Math.min(i0 + 1, ch.length - 1);
        const f = inIdx - i0;
        const s = ch[i0] * (1 - f) + ch[i1] * f;
        const clamped = Math.max(-1, Math.min(1, s));
        this.outputBuffer[this.outputOffset++] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
        if (this.outputOffset >= this.chunkSize) {
          const chunk = new Int16Array(this.outputBuffer);
          this.port.postMessage(chunk.buffer, [chunk.buffer]);
          this.outputOffset = 0;
        }
        inIdx += ratio;
      }
      this.sourceIndex = inIdx - ch.length;
    }
    return true;
  }
}
registerProcessor('pcm-recorder-processor', PCMRecorderProcessor);
`;

export class AudioCapture {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private isCapturing = false;
  private isMuted = false;
  private options: AudioCaptureOptions;

  constructor(options: AudioCaptureOptions) {
    this.options = options;
  }

  /**
   * Starts microphone capture.
   */
  public async start(): Promise<void> {
    if (this.isCapturing) {
      return;
    }

    try {
      // 1. Request microphone permission
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // 2. Setup AudioContext
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      this.audioContext = new AudioContextClass({
        latencyHint: 'interactive',
      });

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

      // 3. Try AudioWorklet first, fall back to ScriptProcessor if needed
      let workletLoaded = false;
      if (this.audioContext.audioWorklet) {
        try {
          // Attempt loading public worklet file first
          await this.audioContext.audioWorklet.addModule('/pcm-recorder-processor.js');
          workletLoaded = true;
        } catch {
          // Fallback to inline blob
          try {
            const blob = new Blob([INLINE_PROCESSOR_CODE], { type: 'application/javascript' });
            const blobUrl = URL.createObjectURL(blob);
            await this.audioContext.audioWorklet.addModule(blobUrl);
            URL.revokeObjectURL(blobUrl);
            workletLoaded = true;
          } catch {
            workletLoaded = false;
          }
        }
      }

      if (workletLoaded) {
        this.setupWorkletNode();
      } else {
        this.setupScriptProcessorNode();
      }

      this.isCapturing = true;
      this.isMuted = false;
    } catch (err: unknown) {
      this.stop();
      const error = err instanceof Error ? err : new Error(String(err));
      this.options.onError?.(error);
      throw error;
    }
  }

  private setupWorkletNode(): void {
    if (!this.audioContext || !this.sourceNode) return;

    this.workletNode = new AudioWorkletNode(this.audioContext, 'pcm-recorder-processor');
    this.workletNode.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
      if (!this.isCapturing || this.isMuted) return;

      const pcmBytes = new Uint8Array(event.data);
      this.options.onChunk(pcmBytes);

      // Compute volume level for UI indicator
      if (this.options.onVolumeChange) {
        const int16View = new Int16Array(pcmBytes.buffer, pcmBytes.byteOffset, pcmBytes.byteLength / 2);
        let sumSquares = 0;
        for (let i = 0; i < int16View.length; i++) {
          const norm = int16View[i] / 32768.0;
          sumSquares += norm * norm;
        }
        const rms = Math.sqrt(sumSquares / int16View.length);
        this.options.onVolumeChange(Math.min(1, rms * 4));
      }
    };

    this.sourceNode.connect(this.workletNode);
    // Connect to dummy destination so chrome doesn't garbage collect worklet
    this.workletNode.connect(this.audioContext.destination);
  }

  private setupScriptProcessorNode(): void {
    if (!this.audioContext || !this.sourceNode) return;

    const bufferSize = 4096;
    this.scriptNode = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

    const targetRate = 16000;
    const currentRate = this.audioContext.sampleRate;
    const ratio = currentRate / targetRate;

    const chunkSize = 1600;
    const outputBuffer = new Int16Array(chunkSize);
    let outputOffset = 0;
    let sourceIndex = 0;

    this.scriptNode.onaudioprocess = (e: AudioProcessingEvent) => {
      if (!this.isCapturing || this.isMuted) return;

      const inputData = e.inputBuffer.getChannelData(0);
      let inIdx = sourceIndex;

      while (inIdx < inputData.length) {
        const i0 = Math.floor(inIdx);
        const i1 = Math.min(i0 + 1, inputData.length - 1);
        const frac = inIdx - i0;
        const s = inputData[i0] * (1 - frac) + inputData[i1] * frac;

        const clamped = Math.max(-1, Math.min(1, s));
        outputBuffer[outputOffset++] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;

        if (outputOffset >= chunkSize) {
          const chunkToSend = new Uint8Array(outputBuffer.buffer.slice(0));
          this.options.onChunk(chunkToSend);
          outputOffset = 0;
        }

        inIdx += ratio;
      }
      sourceIndex = inIdx - inputData.length;

      if (this.options.onVolumeChange) {
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        this.options.onVolumeChange(Math.min(1, rms * 4));
      }
    };

    this.sourceNode.connect(this.scriptNode);
    this.scriptNode.connect(this.audioContext.destination);
  }

  /**
   * Mutes/unmutes audio sending without disconnecting hardware.
   */
  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getIsCapturing(): boolean {
    return this.isCapturing;
  }

  /**
   * Stops audio capture and frees hardware resources.
   */
  public stop(): void {
    this.isCapturing = false;

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      this.mediaStream = null;
    }

    if (this.workletNode) {
      try {
        this.workletNode.disconnect();
      } catch {
        // ignore
      }
      this.workletNode = null;
    }

    if (this.scriptNode) {
      try {
        this.scriptNode.disconnect();
      } catch {
        // ignore
      }
      this.scriptNode = null;
    }

    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {
        // ignore
      }
      this.sourceNode = null;
    }

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
