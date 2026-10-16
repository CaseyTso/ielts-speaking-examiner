/**
 * AudioWorklet processor for capturing microphone audio,
 * resampling to 16kHz if needed, and converting to 16-bit PCM.
 */

class PCMRecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.targetSampleRate = 16000;
    // Buffer for resampling interpolation
    this.resampleRatio = sampleRate / this.targetSampleRate;
    this.sourceIndex = 0;
    // Output chunk size in samples (1600 samples = 100ms at 16kHz)
    this.chunkSize = 1600;
    this.outputBuffer = new Int16Array(this.chunkSize);
    this.outputOffset = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) {
      return true;
    }
    const inputChannel = input[0];
    if (!inputChannel || inputChannel.length === 0) {
      return true;
    }

    if (sampleRate === this.targetSampleRate) {
      // 1:1 sample rate - directly convert Float32 to Int16
      for (let i = 0; i < inputChannel.length; i++) {
        const sample = Math.max(-1, Math.min(1, inputChannel[i]));
        const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        this.outputBuffer[this.outputOffset++] = int16;

        if (this.outputOffset >= this.chunkSize) {
          const chunkToSend = new Int16Array(this.outputBuffer);
          this.port.postMessage(chunkToSend.buffer, [chunkToSend.buffer]);
          this.outputOffset = 0;
        }
      }
    } else {
      // Resample via linear interpolation from context sampleRate to 16000
      const ratio = sampleRate / this.targetSampleRate;
      let inIdx = this.sourceIndex;

      while (inIdx < inputChannel.length) {
        const idx0 = Math.floor(inIdx);
        const idx1 = Math.min(idx0 + 1, inputChannel.length - 1);
        const frac = inIdx - idx0;
        const sample = inputChannel[idx0] * (1 - frac) + inputChannel[idx1] * frac;

        const clamped = Math.max(-1, Math.min(1, sample));
        const int16 = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
        this.outputBuffer[this.outputOffset++] = int16;

        if (this.outputOffset >= this.chunkSize) {
          const chunkToSend = new Int16Array(this.outputBuffer);
          this.port.postMessage(chunkToSend.buffer, [chunkToSend.buffer]);
          this.outputOffset = 0;
        }

        inIdx += ratio;
      }

      this.sourceIndex = inIdx - inputChannel.length;
    }

    return true;
  }
}

registerProcessor('pcm-recorder-processor', PCMRecorderProcessor);
