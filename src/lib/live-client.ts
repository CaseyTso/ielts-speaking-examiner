/**
 * live-client.ts
 * WebSocket client for Gemini Live API (BidiGenerateContent).
 * Handles bi-directional audio streaming, session setup, and real-time transcription.
 */

export type LiveConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface TranscriptEvent {
  speaker: 'user' | 'model';
  text: string;
  isFinal?: boolean;
}

export interface LiveClientCallbacks {
  onAudio?: (pcmChunk: Uint8Array) => void;
  onTranscript?: (event: TranscriptEvent) => void;
  onInterrupted?: () => void;
  onTurnComplete?: () => void;
  onStateChange?: (state: LiveConnectionState) => void;
  onError?: (error: Error) => void;
}

export interface LiveClientConfig {
  model?: string;
  systemInstruction?: string;
  voiceName?: string;
}

const DEFAULT_MODEL = 'models/gemini-3.8-live';
const DEFAULT_SYSTEM_INSTRUCTION =
  'You are a professional IELTS Speaking Examiner. Conduct the speaking practice in natural, standard English. Keep your tone encouraging, objective, and realistic as in a real IELTS exam. Keep responses succinct and conversational.';
const DEFAULT_VOICE = 'Aoede';

export class LiveClient {
  private ws: WebSocket | null = null;
  private state: LiveConnectionState = 'disconnected';
  private callbacks: LiveClientCallbacks;
  private config: LiveClientConfig;
  private connectPromiseResolve: (() => void) | null = null;
  private connectPromiseReject: ((err: Error) => void) | null = null;
  private setupCompleted = false;

  constructor(callbacks: LiveClientCallbacks = {}, config: LiveClientConfig = {}) {
    this.callbacks = callbacks;
    this.config = {
      model: config.model || DEFAULT_MODEL,
      systemInstruction: config.systemInstruction || DEFAULT_SYSTEM_INSTRUCTION,
      voiceName: config.voiceName || DEFAULT_VOICE,
    };
  }

  public setSystemInstruction(instruction: string): void {
    this.config.systemInstruction = instruction;
  }

  public getState(): LiveConnectionState {
    return this.state;
  }

  private setState(newState: LiveConnectionState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.callbacks.onStateChange?.(newState);
    }
  }

  /**
   * Connects to the Gemini Live API WebSocket endpoint and completes setup.
   */
  public async connect(apiKey: string): Promise<void> {
    if (!apiKey || !apiKey.trim()) {
      const err = new Error('Gemini API Key is required to connect to Live API.');
      this.callbacks.onError?.(err);
      throw err;
    }

    if (this.state === 'connected' || this.state === 'connecting') {
      this.disconnect();
    }

    this.setState('connecting');
    this.setupCompleted = false;

    return new Promise<void>((resolve, reject) => {
      this.connectPromiseResolve = resolve;
      this.connectPromiseReject = reject;

      const host = 'generativelanguage.googleapis.com';
      const path = '/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';
      const url = `wss://${host}${path}?key=${encodeURIComponent(apiKey.trim())}`;

      try {
        this.ws = new WebSocket(url);
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        this.setState('error');
        this.callbacks.onError?.(error);
        reject(error);
        return;
      }

      this.ws.onopen = () => {
        this.sendSetupMessage();
      };

      this.ws.onmessage = async (event: MessageEvent) => {
        try {
          let text: string;
          if (typeof event.data === 'string') {
            text = event.data;
          } else if (event.data instanceof Blob) {
            text = await event.data.text();
          } else if (event.data instanceof ArrayBuffer) {
            text = new TextDecoder().decode(event.data);
          } else {
            return;
          }

          this.handleServerMessage(JSON.parse(text));
        } catch (err: unknown) {
          console.warn('[LiveClient] Failed to parse incoming WebSocket message:', err);
        }
      };

      this.ws.onerror = (event: Event) => {
        const error = new Error('WebSocket connection error: ' + (event.type || 'unknown'));
        console.error('[LiveClient] WebSocket error event:', event);
        if (!this.setupCompleted && this.connectPromiseReject) {
          this.connectPromiseReject(error);
          this.connectPromiseReject = null;
          this.connectPromiseResolve = null;
        }
        this.setState('error');
        this.callbacks.onError?.(error);
      };

      this.ws.onclose = (event: CloseEvent) => {
        const wasClean = event.wasClean;
        const code = event.code;
        const reason = event.reason || '';

        if (!this.setupCompleted && this.connectPromiseReject) {
          const error = new Error(
            `Connection closed before setup completed (code: ${code}${reason ? `, reason: ${reason}` : ''}). Check your API Key.`
          );
          this.connectPromiseReject(error);
          this.connectPromiseReject = null;
          this.connectPromiseResolve = null;
          this.setState('error');
          this.callbacks.onError?.(error);
          return;
        }

        if (this.state !== 'disconnected') {
          if (wasClean || code === 1000) {
            this.setState('disconnected');
          } else {
            this.setState('error');
            this.callbacks.onError?.(
              new Error(`WebSocket disconnected unexpectedly (code ${code}${reason ? `: ${reason}` : ''})`)
            );
          }
        }
      };
    });
  }

  private sendSetupMessage(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const setupPayload = {
      setup: {
        model: this.config.model,
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: this.config.voiceName,
              },
            },
          },
        },
        systemInstruction: {
          parts: [
            {
              text: this.config.systemInstruction,
            },
          ],
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
    };

    this.ws.send(JSON.stringify(setupPayload));
  }

  private handleServerMessage(message: Record<string, unknown>): void {
    // 1. Setup complete
    if (message.setupComplete) {
      this.setupCompleted = true;
      this.setState('connected');
      if (this.connectPromiseResolve) {
        this.connectPromiseResolve();
        this.connectPromiseResolve = null;
        this.connectPromiseReject = null;
      }
      return;
    }

    // 2. Error from server
    if (message.error) {
      const errObj = message.error as { message?: string; code?: number };
      const err = new Error(errObj.message || `Gemini Live error (code ${errObj.code})`);
      this.callbacks.onError?.(err);
      return;
    }

    // 3. Server content
    if (message.serverContent) {
      const serverContent = message.serverContent as Record<string, unknown>;

      // Interruption notice
      if (serverContent.interrupted) {
        this.callbacks.onInterrupted?.();
      }

      // Input audio transcription (user speaking)
      if (serverContent.inputTranscription) {
        const inputTx = serverContent.inputTranscription as { text?: string };
        if (inputTx.text) {
          this.callbacks.onTranscript?.({
            speaker: 'user',
            text: inputTx.text,
            isFinal: false,
          });
        }
      }

      // Output audio transcription (model speaking)
      if (serverContent.outputTranscription) {
        const outputTx = serverContent.outputTranscription as { text?: string };
        if (outputTx.text) {
          this.callbacks.onTranscript?.({
            speaker: 'model',
            text: outputTx.text,
            isFinal: false,
          });
        }
      }

      // Model turn parts (PCM audio or direct text parts)
      if (serverContent.modelTurn) {
        const modelTurn = serverContent.modelTurn as {
          parts?: Array<{
            text?: string;
            inlineData?: {
              mimeType?: string;
              data?: string;
            };
          }>;
        };

        if (Array.isArray(modelTurn.parts)) {
          for (const part of modelTurn.parts) {
            // Text part
            if (part.text) {
              this.callbacks.onTranscript?.({
                speaker: 'model',
                text: part.text,
                isFinal: false,
              });
            }

            // Audio PCM part
            if (part.inlineData && part.inlineData.data) {
              const base64 = part.inlineData.data;
              const binary = atob(base64);
              const pcmBytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) {
                pcmBytes[i] = binary.charCodeAt(i);
              }
              this.callbacks.onAudio?.(pcmBytes);
            }
          }
        }
      }

      // Turn complete notice
      if (serverContent.turnComplete) {
        this.callbacks.onTurnComplete?.();
      }
    }
  }

  /**
   * Sends 16kHz 16-bit PCM audio chunk to Gemini Live API.
   */
  public sendAudio(chunk: Uint8Array): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    let binary = '';
    const len = chunk.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(chunk[i]);
    }
    const base64Data = btoa(binary);

    const payload = {
      realtimeInput: {
        mediaChunks: [
          {
            mimeType: 'audio/pcm;rate=16000',
            data: base64Data,
          },
        ],
      },
    };

    this.ws.send(JSON.stringify(payload));
  }

  /**
   * Sends a user text message turn.
   */
  public sendTextMessage(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const payload = {
      clientContent: {
        turns: [
          {
            role: 'user',
            parts: [{ text }],
          },
        ],
        turnComplete: true,
      },
    };

    this.ws.send(JSON.stringify(payload));
  }

  /**
   * Disconnects the WebSocket session.
   */
  public disconnect(): void {
    if (this.ws) {
      try {
        this.ws.close(1000, 'User ended session');
      } catch {
        // ignore
      }
      this.ws = null;
    }
    this.setupCompleted = false;
    this.setState('disconnected');
  }
}
