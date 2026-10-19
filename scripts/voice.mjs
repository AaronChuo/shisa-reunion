// Records the narration with Azure's Taiwan Mandarin neural voice, so the game reads aloud in the same voice on every
// device, offline. Each line the game reads (src/audio/voiceLines.ts) becomes public/voice/<key>.mp3, named after what
// is said and how (src/audio/voice.ts), so only new or changed lines are recorded and unused recordings are removed.
// The list of recordings goes to src/audio/voices.json; the game reads with the device voice when a line is missing.
// Needs AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in .env.local (see .env.example), which never goes into the repo.
// Re-run with `pnpm voice` after changing any text that is read aloud.
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createServer } from 'vite';

const OUT = 'public/voice';
const LIST = 'src/audio/voices.json';
const FORMAT = 'audio-24khz-48kbitrate-mono-mp3';
// The free tier takes 20 requests a minute; a paid resource can set VOICE_GAP_MS=0
const GAP_MS = Number(process.env.VOICE_GAP_MS ?? 3200);
const { AZURE_SPEECH_KEY: KEY, AZURE_SPEECH_REGION: REGION } = process.env;
if (!KEY || !REGION) {
  console.error('Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in .env.local (Azure portal → the Speech resource → Keys and Endpoint)');
  process.exit(1);
}

// The lines and their keys come from the game's own modules, loaded through Vite so the TypeScript runs as is
const vite = await createServer({
  configFile: false,
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});
const { voiceLines } = await vite.ssrLoadModule('/src/audio/voiceLines.ts');
const { RECORDING, speakable, voiceKey } = await vite.ssrLoadModule('/src/audio/voice.ts');
await vite.close();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** One line as SSML: the voice, its tone, and the text as the voice should say it */
function ssml(text, as) {
  const r = RECORDING[as];
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-TW"><voice name="${r.name}"><prosody pitch="${r.pitch}" rate="${r.rate}">${esc(speakable(text))}</prosody></voice></speak>`;
}

/** Asks Azure for one recording, waiting and trying again when rate-limited or briefly unavailable */
async function record(text, as) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': KEY,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': FORMAT,
        'User-Agent': 'shisa-reunion-voice',
      },
      body: ssml(text, as),
    });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    if (res.status !== 429 && res.status < 500) throw new Error(`${res.status} ${await res.text()} for: ${text}`);
    await sleep(Number(res.headers.get('retry-after') ?? 0) * 1000 || 5000 * (attempt + 1));
  }
  throw new Error(`still failing for: ${text}`);
}

const lines = new Map();
for (const l of voiceLines()) lines.set(voiceKey(l.text, l.as), l);
mkdirSync(OUT, { recursive: true });
const have = new Set(readdirSync(OUT).map((f) => f.replace(/\.mp3$/, '')));
const todo = [...lines].filter(([key]) => !have.has(key));
let chars = 0;
for (const [i, [key, l]] of todo.entries()) {
  if (i > 0) await sleep(GAP_MS);
  writeFileSync(join(OUT, `${key}.mp3`), await record(l.text, l.as));
  chars += speakable(l.text).length;
  console.log(`${i + 1}/${todo.length} ${l.as} ${speakable(l.text).slice(0, 24)}`);
}
const gone = [...have].filter((key) => !lines.has(key));
for (const key of gone) rmSync(join(OUT, `${key}.mp3`));
writeFileSync(LIST, `${JSON.stringify([...lines.keys()].sort(), null, 2)}\n`);
console.log(`${lines.size} lines: ${todo.length} recorded (${chars} characters), ${gone.length} removed`);
