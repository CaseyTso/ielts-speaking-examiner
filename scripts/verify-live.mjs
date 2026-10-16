#!/usr/bin/env node

/**
 * verify-live.mjs
 * Verification script for Gemini Live API WebSocket connection.
 * Connects to Gemini Live API, sends setup message, and waits for setupComplete.
 *
 * Usage:
 *   GEMINI_API_KEY=your_key node scripts/verify-live.mjs
 */

import WebSocket from 'ws';
import { HttpsProxyAgent } from 'https-proxy-agent';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey || !apiKey.trim()) {
  console.error('[ERROR] GEMINI_API_KEY environment variable is required.');
  console.error('Usage: GEMINI_API_KEY=your_key node scripts/verify-live.mjs');
  process.exit(1);
}

const proxyUrl =
  process.env.https_proxy ||
  process.env.http_proxy ||
  process.env.HTTPS_PROXY ||
  process.env.HTTP_PROXY;

const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;
if (proxyUrl) {
  console.log(`[INFO] Using proxy: ${proxyUrl}`);
}

const MODEL = 'models/gemini-3.8-live';
const HOST = 'generativelanguage.googleapis.com';
const PATH = '/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';
const wsUrl = `wss://${HOST}${PATH}?key=${encodeURIComponent(apiKey.trim())}`;

console.log(`[INFO] Connecting to Gemini Live API (${MODEL})...`);

const ws = new WebSocket(wsUrl, {
  agent,
  handshakeTimeout: 10000,
});

let setupDone = false;
const timeoutId = setTimeout(() => {
  if (!setupDone) {
    console.error('[ERROR] Timeout waiting for setupComplete after 15s.');
    try {
      ws.close();
    } catch {
      // ignore
    }
    process.exit(1);
  }
}, 15000);

ws.on('open', () => {
  console.log('[INFO] WebSocket connected, sending setup payload...');
  const setupMessage = {
    setup: {
      model: MODEL,
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Aoede',
            },
          },
        },
      },
      systemInstruction: {
        parts: [
          {
            text: 'You are an IELTS speaking examiner. Keep responses concise, natural, and examiner-like.',
          },
        ],
      },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
    },
  };

  ws.send(JSON.stringify(setupMessage));
});

ws.on('message', (data) => {
  try {
    const text = data.toString();
    const parsed = JSON.parse(text);

    if (parsed.setupComplete) {
      setupDone = true;
      clearTimeout(timeoutId);
      console.log('--------------------------------------------------');
      console.log('[VERIFY RESULT] SETUP_COMPLETE received successfully!');
      console.log(`[VERIFY RESULT] Model: ${MODEL}`);
      console.log('[VERIFY RESULT] Status: OK');
      console.log('--------------------------------------------------');
      ws.close();
      process.exit(0);
    }
  } catch (err) {
    console.error('[WARN] Failed to parse incoming message as JSON:', err);
  }
});

ws.on('error', (err) => {
  console.error('[ERROR] WebSocket encountered an error:', err.message || err);
});

ws.on('close', (code, reason) => {
  const reasonStr = reason ? reason.toString() : '';
  if (!setupDone) {
    console.error(`[ERROR] WebSocket closed before setup was complete. Code: ${code}, Reason: ${reasonStr || 'None'}`);
    process.exit(1);
  }
});
