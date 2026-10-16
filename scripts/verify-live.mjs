#!/usr/bin/env node

/**
 * verify-live.mjs
 * Verification script for Gemini Live API segmented sessions and systemInstruction injection.
 * Verifies that:
 * 1. Part 1 session setup with injected Progress Digest is accepted by API
 * 2. Part 2 session setup with injected Cue Card + Part 1 summary is accepted by API
 * 3. Part 3 session setup with injected Part 3 theme + Part 1 & 2 summaries is accepted by API
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

// Realistic test payloads representing the 3-part segmented session flow
const TEST_STAGES = [
  {
    name: 'Part 1: Introduction & Interview + Progress Digest Injection',
    instruction: `You are an official IELTS Speaking Examiner conducting Part 1.
Topics: Hometown and Neighborhood, Daily Routine.
Ask one question at a time. Do not correct or teach.
[CANDIDATE HISTORICAL CONTEXT / PROGRESS DIGEST]
Candidate previously tended to pause excessively when searching for vocabulary and used limited complex grammar structures.
Observe silently without mentioning this to the candidate.`,
  },
  {
    name: 'Part 2: Individual Long Turn (Cue Card + Part 1 Summary Injection)',
    instruction: `You are an official IELTS Speaking Examiner conducting Part 2.
Cue Card: Describe a person you admire who has achieved something meaningful.
Listen silently during the monologue. Do not interrupt.
[PREVIOUS STAGE CONTEXT - PART 1 DIGEST]
Candidate spoke about living in a coastal town and working as a software developer with a structured routine.`,
  },
  {
    name: 'Part 3: Two-way Discussion (Part 1 & 2 Summaries Injection)',
    instruction: `You are an official IELTS Speaking Examiner conducting Part 3.
Theme: Role models, celebrities, and modern definitions of success.
Ask analytical, evaluative questions.
[PREVIOUS STAGES CONTEXT - PART 1 & 2 TRANSCRIPTS]
Candidate discussed software work in Part 1 and admired a scientific researcher who cured diseases in Part 2.`,
  },
];

function verifySession(stage, index) {
  return new Promise((resolve, reject) => {
    console.log(`\n--------------------------------------------------`);
    console.log(`[STAGE ${index + 1}/3] Connecting: ${stage.name}`);
    console.log(`[INFO] Connecting to ${MODEL}...`);

    const ws = new WebSocket(wsUrl, {
      agent,
      handshakeTimeout: 10000,
    });

    let setupDone = false;
    const timeout = setTimeout(() => {
      if (!setupDone) {
        try {
          ws.close();
        } catch {}
        reject(new Error(`Timeout waiting for setupComplete in ${stage.name} after 15s.`));
      }
    }, 15000);

    ws.on('open', () => {
      console.log(`[INFO] WebSocket connected, sending setup message with custom systemInstruction...`);
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
                text: stage.instruction,
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
          clearTimeout(timeout);
          console.log(`[VERIFY RESULT] ${stage.name} -> SETUP_COMPLETE received!`);
          ws.close(1000, 'Verification stage complete');
          resolve();
        }

        if (parsed.error) {
          clearTimeout(timeout);
          reject(new Error(`API Error in ${stage.name}: ${JSON.stringify(parsed.error)}`));
        }
      } catch (err) {
        console.warn('[WARN] Failed to parse message JSON:', err);
      }
    });

    ws.on('error', (err) => {
      clearTimeout(timeout);
      reject(new Error(`WebSocket error in ${stage.name}: ${err.message || err}`));
    });

    ws.on('close', (code, reason) => {
      clearTimeout(timeout);
      if (!setupDone && code !== 1000) {
        reject(new Error(`WebSocket closed unexpectedly (code: ${code}, reason: ${reason || 'none'})`));
      }
    });
  });
}

async function run() {
  console.log('================================================================');
  console.log('Gemini Live API Segmented Sessions & Prompt Injection Verifier');
  console.log(`Target Model: ${MODEL}`);
  console.log(`Stages to test: ${TEST_STAGES.length}`);
  console.log('================================================================');

  try {
    for (let i = 0; i < TEST_STAGES.length; i++) {
      await verifySession(TEST_STAGES[i], i);
      // Small pause between segmented sessions
      await new Promise((r) => setTimeout(r, 800));
    }

    console.log('\n================================================================');
    console.log('ALL 3 SEGMENTED SESSIONS VERIFIED SUCCESSFULLY!');
    console.log('1. Part 1 + Progress Digest Injection: OK');
    console.log('2. Part 2 + Cue Card & Part 1 Summary Injection: OK');
    console.log('3. Part 3 + Topic & Part 1+2 Summary Injection: OK');
    console.log('Status: 100% OK');
    console.log('================================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n[FATAL ERROR] Verification failed:', err.message || err);
    process.exit(1);
  }
}

run();
