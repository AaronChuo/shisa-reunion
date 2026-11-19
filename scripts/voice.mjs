// Records every line the game reads aloud, so it sounds the same on every device and plays offline: the narration with
// Azure's Taiwan Mandarin neural voice (ADR-0021), the shisa with its own voice designed with Gemini (ADR-0040). Each
// line (src/audio/voiceLines.ts) becomes public/voice/<key>.mp3, named after what is said and how (src/audio/voice.ts),
// so only new or changed lines are recorded and unused recordings are removed. The list of recordings goes to
// src/audio/voices.json; the game reads with the device voice when a line is missing.
// Needs, in .env.local (see .env.example), which never goes into the repo: AZURE_SPEECH_KEY and AZURE_SPEECH_REGION for
// narration, GEMINI_API_KEY for the shisa; and ffmpeg for the shisa's lines.
// Re-run with `pnpm voice` after changing any text that is read aloud. A Gemini take now and then adds or drops a word:
// listen, then record it again with `pnpm voice --again "<part of the line>"`.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'vite';

const OUT = 'public/voice';
const LIST = 'src/audio/voices.json';
const AZURE_FORMAT = 'audio-24khz-48kbitrate-mono-mp3';
// The free tier takes 20 requests a minute; a paid resource can set VOICE_GAP_MS=0
const GAP_MS = Number(process.env.VOICE_GAP_MS ?? 3200);
/** As loud as the Azure narration, so the shisa and the storyteller sound side by side */
const LOUDNESS = -19;

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

/** Calls `ask` until it answers, waiting and trying again when rate-limited or briefly unavailable */
async function retrying(ask, text) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await ask();
    if (res.ok) return res;
    if (res.status !== 429 && res.status < 500) throw new Error(`${res.status} ${await res.text()} for: ${text}`);
    await sleep(Number(res.headers.get('retry-after') ?? 0) * 1000 || 5000 * (attempt + 1));
  }
  throw new Error(`still failing for: ${text}`);
}

/** One line from Azure, as SSML: the voice, its tone, and the text as the voice should say it */
async function azure(text, r) {
  const { AZURE_SPEECH_KEY: KEY, AZURE_SPEECH_REGION: REGION } = process.env;
  if (!KEY || !REGION) throw new Error('Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in .env.local (Azure portal → the Speech resource → Keys and Endpoint)');
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-TW"><voice name="${r.name}"><prosody pitch="${r.pitch}" rate="${r.rate}">${esc(speakable(text))}</prosody></voice></speak>`;
  const res = await retrying(
    () =>
      fetch(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': KEY,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': AZURE_FORMAT,
          'User-Agent': 'shisa-reunion-voice',
        },
        body: ssml,
      }),
    text,
  );
  return Buffer.from(await res.arrayBuffer());
}

/** One line from the designed Gemini voice, said the way `style` asks */
async function gemini(text, style, r) {
  const KEY = process.env.GEMINI_API_KEY;
  if (!KEY) throw new Error('Set GEMINI_API_KEY in .env.local (Google AI Studio → Get API key)');
  const res = await retrying(
    () =>
      fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
        method: 'POST',
        headers: { 'x-goog-api-key': KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: r.model,
          input: [
            {
              type: 'user_input',
              content: [{ type: 'text', text: speakable(text), annotations: style ? [{ type: 'speech_metadata', style }] : [] }],
            },
          ],
          response_format: { type: 'audio', mime_type: 'audio/wav' },
          generation_config: { speech_config: [{ voice: r.voice }] },
        }),
      }),
    text,
  );
  const { steps = [] } = await res.json();
  const audio = steps
    .filter((s) => s.type === 'model_output')
    .flatMap((s) => s.content ?? [])
    .filter((c) => c.type === 'audio');
  if (!audio.length) throw new Error(`no audio for: ${text}`);
  return finish(Buffer.from(audio.at(-1).data, 'base64'), r.tempo);
}

/** A Gemini take as the game plays it: no silence around it, as loud as the narration, slowed to `tempo`, MP3 like Azure's */
function finish(wav, tempo) {
  const dir = mkdtempSync(join(tmpdir(), 'shisa-voice-'));
  const src = join(dir, 'take.wav');
  const out = join(dir, 'line.mp3');
  try {
    writeFileSync(src, wav);
    const trim = 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse';
    const { stderr } = spawnSync('ffmpeg', ['-hide_banner', '-nostdin', '-i', src, '-af', `${trim},loudnorm=print_format=json`, '-f', 'null', '-'], {
      encoding: 'utf8',
    });
    const loud = /"input_i"\s*:\s*"(-?[\d.]+)"/.exec(stderr);
    if (!loud) throw new Error(`ffmpeg could not measure a take: ${stderr.slice(-300)}`);
    const gain = (LOUDNESS - Number(loud[1])).toFixed(2);
    const filters = `${trim},volume=${gain}dB,atempo=${tempo},alimiter=limit=0.84:level=false`;
    execFileSync('ffmpeg', [
      '-v',
      'error',
      '-nostdin',
      '-i',
      src,
      '-af',
      filters,
      '-map_metadata',
      '-1',
      '-ar',
      '24000',
      '-ac',
      '1',
      '-c:a',
      'libmp3lame',
      '-b:a',
      '48k',
      out,
    ]);
    return readFileSync(out);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const again = process.argv.includes('--again') ? process.argv[process.argv.indexOf('--again') + 1] : null;
const lines = new Map();
for (const l of voiceLines()) lines.set(voiceKey(l.text, l.as), l);
mkdirSync(OUT, { recursive: true });
const have = new Set(readdirSync(OUT).map((f) => f.replace(/\.mp3$/, '')));
// --again takes the line that says exactly that, or else every line that has it in it
const exact = again && [...lines.values()].some((l) => l.text === again);
const retake = (l) => again && (exact ? l.text === again : l.text.includes(again));
const todo = [...lines].filter(([key, l]) => !have.has(key) || retake(l));
if (again && !todo.some(([, l]) => retake(l))) throw new Error(`no line says "${again}"`);
let chars = 0;
for (const [i, [key, l]] of todo.entries()) {
  const r = RECORDING[l.as];
  if (i > 0) await sleep(r.engine === 'azure' ? GAP_MS : 1000);
  const mp3 = r.engine === 'azure' ? await azure(l.text, r) : await gemini(l.text, l.style, r);
  writeFileSync(join(OUT, `${key}.mp3`), mp3);
  chars += speakable(l.text).length;
  console.log(`${i + 1}/${todo.length} ${l.as} ${key} ${speakable(l.text).slice(0, 24)}`);
}
const gone = [...have].filter((key) => !lines.has(key));
for (const key of gone) rmSync(join(OUT, `${key}.mp3`));
writeFileSync(LIST, `${JSON.stringify([...lines.keys()].sort(), null, 2)}\n`);
console.log(`${lines.size} lines: ${todo.length} recorded (${chars} characters), ${gone.length} removed`);
