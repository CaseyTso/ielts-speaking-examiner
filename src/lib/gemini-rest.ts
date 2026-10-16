/**
 * gemini-rest.ts
 * Helper for Gemini text model REST calls via generateContent with model fallbacks and retry.
 */

export const DEFAULT_REPORT_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
] as const;

export interface RestGenerateOptions {
  temperature?: number;
  customFetch?: typeof fetch;
  onModelAttempt?: (model: string) => void;
  maxRetriesPerModel?: number;
}

export interface RestGenerateResult {
  text: string;
  modelUsed: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Invokes Gemini generateContent REST endpoint with automatic retry on 503/429
 * and automatic fallback across models.
 */
export async function generateContentWithFallback(
  prompt: string,
  apiKey: string,
  models: readonly string[] = DEFAULT_REPORT_MODELS,
  options?: RestGenerateOptions
): Promise<RestGenerateResult> {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) {
    throw new Error('Gemini API Key is required to call generateContent');
  }

  const fetchFn =
    options?.customFetch ||
    (typeof window !== 'undefined' ? window.fetch.bind(window) : globalThis.fetch);
  const temperature = options?.temperature ?? 0.3;
  const maxRetries = options?.maxRetriesPerModel ?? 2;

  const errors: string[] = [];

  for (const model of models) {
    options?.onModelAttempt?.(model);
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(trimmedKey)}`;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const waitTime = attempt * 1500;
          console.warn(`[Gemini REST] Retrying ${model} (attempt ${attempt + 1}/${maxRetries + 1}) after ${waitTime}ms...`);
          await sleep(waitTime);
        }

        const response = await fetchFn(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature,
            },
          }),
        });

        if (!response.ok) {
          let errorDetail = `HTTP ${response.status} ${response.statusText}`;
          try {
            const errJson = await response.json();
            if (errJson?.error?.message) {
              errorDetail = errJson.error.message;
            }
          } catch {
            // ignore json parse failure
          }

          // If 503 or 429, retry this model if attempts remaining
          if ((response.status === 503 || response.status === 429) && attempt < maxRetries) {
            console.warn(`[Gemini REST] Model ${model} returned ${response.status} (${errorDetail}), will retry...`);
            continue;
          }

          console.warn(`[Gemini REST] Model ${model} returned ${response.status}: ${errorDetail}`);
          errors.push(`${model} -> ${errorDetail}`);
          break; // break retry loop, move to next model
        }

        const data = await response.json();
        const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (typeof candidateText === 'string' && candidateText.trim().length > 0) {
          return {
            text: candidateText.trim(),
            modelUsed: model,
          };
        }

        const emptyWarning = `${model} returned empty candidates text`;
        console.warn(`[Gemini REST] ${emptyWarning}`);
        errors.push(emptyWarning);
        break;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        if (attempt < maxRetries) {
          console.warn(`[Gemini REST] Model ${model} network error: ${message}, will retry...`);
          continue;
        }
        console.warn(`[Gemini REST] Model ${model} failed after retries: ${message}`);
        errors.push(`${model} -> ${message}`);
        break;
      }
    }
  }

  throw new Error(`All candidate models failed: ${errors.join('; ')}`);
}
