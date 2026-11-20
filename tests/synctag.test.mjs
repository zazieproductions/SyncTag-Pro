import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import vm from 'node:vm';

const ROOT = process.cwd();
const HTML_SOURCE = readFileSync(resolve(ROOT, 'index.html'), 'utf8');

/**
 * Extract the main application <script> block from index.html and boot it inside
 * an isolated node:vm context backed by a lightweight deterministic DOM stub so
 * tests exercise the literal production functions (no duplicated encoder logic).
 */
function createAppHarness() {
  const scripts = [...HTML_SOURCE.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
  const appScript = scripts[scripts.length - 1][1];

  const elements = new Map();
  const writerRows = [
    makeWriterRow('Marcus Vance', 'BMI', '00849204918', '50'),
    makeWriterRow('Nightfall Music Publishing', 'BMI', '00389102451', '50'),
  ];

  function makeElement(id = '', initialValue = '') {
    const classSet = new Set();
    const children = [];
    const el = {
      id,
      value: initialValue,
      textContent: '',
      innerText: '',
      disabled: false,
      scrollTop: 0,
      scrollHeight: 0,
      parentElement: { clientWidth: 320, clientHeight: 56 },
      _innerHTML: '',
      get innerHTML() {
        return this._innerHTML;
      },
      set innerHTML(val) {
        this._innerHTML = String(val);
        if (val === '') {
          children.length = 0;
          if (id === 'splitsContainer') writerRows.length = 0;
        }
      },
      className: '',
      classList: {
        add: (...cls) => cls.forEach((c) => classSet.add(c)),
        remove: (...cls) => cls.forEach((c) => classSet.delete(c)),
        contains: (c) => classSet.has(c),
      },
      children,
      appendChild(child) {
        children.push(child);
        if (id === 'splitsContainer' && child._isWriterRow) {
          writerRows.push(child);
        }
        return child;
      },
      removeChild(child) {
        const idx = children.indexOf(child);
        if (idx >= 0) children.splice(idx, 1);
      },
      addEventListener() {},
      setAttribute() {},
      getContext() {
        return { clearRect() {}, fillRect() {}, fillStyle: '' };
      },
      click() {},
      play() {},
      pause() {},
    };
    return el;
  }

  function makeWriterRow(name, pro, ipi, split) {
    const inputs = [
      { value: name, placeholder: 'Writer Full Legal Name (First Last)', oninput: null },
      { value: pro, placeholder: '', oninput: null },
      { value: ipi, placeholder: 'IPI / CAE #', oninput: null },
      { value: String(split), placeholder: '50', className: 'split-percent', oninput: null },
    ];
    const row = {
      _isWriterRow: true,
      inputs,
      className: 'writer-row',
      _innerHTML: '',
      set innerHTML(html) {
        this._innerHTML = html;
        const nameMatch = html.match(/placeholder="Writer Full Legal Name[^"]*"\s+value="([^"]*)"/);
        const proMatch = html.match(/<option value="([^"]+)"\s+selected/);
        const ipiMatch = html.match(/placeholder="IPI \/ CAE #"\s+value="([^"]*)"/);
        const splitMatch = html.match(/placeholder="50"\s+value="([^"]*)"/);
        inputs[0].value = nameMatch ? nameMatch[1] : '';
        inputs[1].value = proMatch ? proMatch[1] : 'BMI';
        inputs[2].value = ipiMatch ? ipiMatch[1] : '';
        inputs[3].value = splitMatch ? splitMatch[1] : '50';
      },
      get innerHTML() {
        return this._innerHTML;
      },
      querySelectorAll() {
        return inputs;
      },
      remove() {
        const idx = writerRows.indexOf(row);
        if (idx >= 0) writerRows.splice(idx, 1);
      },
    };
    return row;
  }

  const localStorageData = new Map();
  const fakeLocalStorage = {
    getItem: (key) => localStorageData.has(key) ? localStorageData.get(key) : null,
    setItem: (key, value) => localStorageData.set(key, String(value)),
    removeItem: (key) => localStorageData.delete(key),
  };

  const defaults = {
    metaTitle: '',
    metaVersion: 'Instrumental',
    metaArtist: '',
    metaAlbum: '',
    metaYear: '2025',
    metaISRC: '',
    metaISWC: '',
    metaClearance: '100% ONE-STOP (Both Master & Sync 100% Pre-cleared)',
    metaBPM: '',
    metaKey: '',
    metaExplicit: 'Clean / None',
    metaMasterOwner: 'Nightfall Records LLC',
    metaContactEmail: 'sync@nightfallmusic.com',
    metaContactPhone: '+1 (310) 555-0192',
    metaRecordLabel: '',
    metaWebsite: '',
    metaSoundsLike: 'Low strings, synth pulse, orchestral build',
    metaPlacementNotes: 'Crime Drama, High-Speed Chase, Sci-Fi Thriller trailer',
    metaComments: '',
  };

  for (const [id, val] of Object.entries(defaults)) {
    elements.set(id, makeElement(id, val));
  }

  let nowValue = 1_700_000_000_000;
  const FakeDate = class extends Date {
    static now() {
      return nowValue;
    }
  };

  const document = {
    body: makeElement('body'),
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, makeElement(id));
      return elements.get(id);
    },
    createElement(tag) {
      if (tag === 'div') {
        const probe = makeElement('div');
        Object.defineProperty(probe, 'className', {
          configurable: true,
          get() {
            return this._cls || '';
          },
          set(v) {
            this._cls = v;
            if (String(v).startsWith('writer-row') && !probe._isWriterRow) {
              const wr = makeWriterRow('', 'BMI', '', '50');
              probe._isWriterRow = true;
              probe.inputs = wr.inputs;
              probe.querySelectorAll = wr.querySelectorAll;
              probe.remove = wr.remove;
              Object.defineProperty(
                probe,
                'innerHTML',
                Object.getOwnPropertyDescriptor(wr, 'innerHTML'),
              );
            }
          },
        });
        return probe;
      }
      return makeElement(tag);
    },
    querySelectorAll(selector) {
      if (selector === '.writer-row') return writerRows;
      if (selector === '.split-percent') return writerRows.map((r) => r.inputs[3]);
      if (selector === '.writer-row input[placeholder*="IPI"]') return writerRows.map((r) => r.inputs[2]);
      return [...elements.values()];
    },
  };

  const context = vm.createContext({
    window: { addEventListener() {} },
    document,
    TextEncoder,
    TextDecoder,
    Uint8Array,
    ArrayBuffer,
    Blob,
    URL,
    Set,
    Math,
    Date: FakeDate,
    console,
    parseFloat,
    setTimeout: () => 0,
    clearTimeout() {},
    localStorage: fakeLocalStorage,
    prompt: () => 'Custom Co-Pub Vault',
    lucide: { createIcons() {} },
    pdfjsLib: { GlobalWorkerOptions: {} },
    Papa: { parse() {} },
  });

  // Expose top-level `let`/`const` bindings via a helper accessor for assertions
  const instrumented = `${appScript}
globalThis.__state = {
  get syncProfiles() { return syncProfiles; },
  get PRESET_GENRES() { return PRESET_GENRES; },
  get PRESET_MOODS() { return PRESET_MOODS; },
  get selectedGenres() { return selectedGenres; },
  get selectedMoods() { return selectedMoods; },
  setAudioBuffer(buf, name, type) {
    uploadedAudioArrayBuffer = buf;
    if (name) audioFileName = name;
    if (type) audioFileType = type;
  },
  getEditorSnapshot,
  applyEditorSnapshot,
  saveDraft,
  restoreDraft,
  applyZazieProfile,
  get cueCatalog() { return cueCatalog; },
  saveCueToCatalog,
  loadCatalogCue,
  deleteCatalogCue,
  exportCueCollectionCsv
};`;

  vm.runInContext(instrumented, context, { filename: 'index.html' });

  return {
    ctx: context,
    document,
    writerRows,
    advanceTime(ms) {
      nowValue += ms;
    },
  };
}

/** Decode an ID3v2.3 binary buffer produced by embedMp3ID3Metadata(). */
function parseId3v23(bytes) {
  const magic = new TextDecoder('ascii').decode(bytes.slice(0, 3));
  const versionMajor = bytes[3];
  const versionRev = bytes[4];
  const flags = bytes[5];
  // Verify syncsafe MSBs are 0
  for (let i = 6; i <= 9; i++) {
    assert.equal(bytes[i] & 0x80, 0, `Header size byte ${i} must be syncsafe (MSB=0)`);
  }
  const tagSize = (bytes[6] << 21) | (bytes[7] << 14) | (bytes[8] << 7) | bytes[9];
  const frames = [];
  let offset = 10;
  const end = 10 + tagSize;
  const utf8 = new TextDecoder('utf-8');

  while (offset < end) {
    const id = new TextDecoder('ascii').decode(bytes.slice(offset, offset + 4));
    const size =
      ((bytes[offset + 4] << 24) >>> 0) |
      (bytes[offset + 5] << 16) |
      (bytes[offset + 6] << 8) |
      bytes[offset + 7];
    const frameFlags = (bytes[offset + 8] << 8) | bytes[offset + 9];
    const body = bytes.slice(offset + 10, offset + 10 + size);
    const encoding = body[0];

    if (id === 'COMM') {
      const lang = new TextDecoder('ascii').decode(body.slice(1, 4));
      assert.equal(body[4], 0x00, 'COMM short-description null terminator');
      const text = utf8.decode(body.slice(5));
      frames.push({ id, size, frameFlags, encoding, lang, text });
    } else if (id === 'TXXX') {
      const sep = body.indexOf(0x00, 1);
      const description = utf8.decode(body.slice(1, sep));
      const value = utf8.decode(body.slice(sep + 1));
      frames.push({ id, size, frameFlags, encoding, description, value });
    } else {
      const text = utf8.decode(body.slice(1));
      frames.push({ id, size, frameFlags, encoding, text });
    }
    offset += 10 + size;
  }

  assert.equal(offset, end, 'Frame lengths must sum strictly to syncsafe header size');
  return { magic, versionMajor, versionRev, flags, tagSize, frames, audioPayload: bytes.slice(end) };
}

/** Build a minimal spec-valid RIFF WAVE PCM file buffer for testing. */
function buildMinimalWav(pcmSamples = [0x01, 0x02, 0x03, 0x04, 0x7f, 0x80, 0xfe, 0xff]) {
  const dataSize = pcmSamples.length;
  const totalSize = 44 + dataSize;
  const buf = new Uint8Array(totalSize);
  const view = new DataView(buf.buffer);
  const writeAscii = (off, str) => {
    for (let i = 0; i < str.length; i++) buf[off + i] = str.charCodeAt(i);
  };
  writeAscii(0, 'RIFF');
  view.setUint32(4, totalSize - 8, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 2, true); // Stereo
  view.setUint32(24, 48000, true); // 48 kHz
  view.setUint32(28, 192000, true);
  view.setUint16(32, 4, true);
  view.setUint16(34, 16, true);
  writeAscii(36, 'data');
  view.setUint32(40, dataSize, true);
  buf.set(pcmSamples, 44);
  return buf;
}

describe('Binary Encoder — MP3 ID3v2.3 (embedMp3ID3Metadata)', () => {
  it('writes valid ID3v2.3 header, all 13 sync frames, and preserves bit-exact MPEG audio', async () => {
    const { ctx } = createAppHarness();
    const fakeMpeg = new Uint8Array([0xff, 0xfb, 0x90, 0x64, 0x11, 0x22, 0x33, 0x44, 0xaa, 0x55]);
    const meta = {
      title: 'Quantum Horizon (Trailer Mix)',
      artist: 'Zazie Productions',
      album: 'Cinematic Impact Vol. 1',
      year: '2026',
      genre: 'Cinematic Tension / Trailer Hybrid Orchestral',
      bpm: '130',
      key: 'D Minor',
      isrc: 'US-S1Z-25-00812',
      publisher: 'Zazie Productions LLC (100%)',
      comment: '[SYNC CLEARANCE MEMO]\nDIRECT CONTACT: zaziediya@gmail.com',
      contact: 'zaziediya@gmail.com',
      mood: 'Building / Crescendo, Suspenseful / Mysterious',
    };

    const blob = ctx.embedMp3ID3Metadata(fakeMpeg.buffer, meta);
    assert.equal(blob.type, 'audio/mpeg');
    const out = new Uint8Array(await blob.arrayBuffer());
    const parsed = parseId3v23(out);

    assert.equal(parsed.magic, 'ID3');
    assert.equal(parsed.versionMajor, 3);
    assert.equal(parsed.versionRev, 0);
    assert.equal(parsed.flags, 0);
    assert.equal(parsed.frames.length, 13);

    const byId = Object.fromEntries(
      parsed.frames.filter((f) => f.id !== 'TXXX').map((f) => [f.id, f]),
    );
    assert.equal(byId.TIT2.text, meta.title);
    assert.equal(byId.TPE1.text, meta.artist);
    assert.equal(byId.TALB.text, meta.album);
    assert.equal(byId.TYER.text, meta.year);
    assert.equal(byId.TCON.text, meta.genre);
    assert.equal(byId.TBPM.text, meta.bpm);
    assert.equal(byId.TKEY.text, meta.key);
    assert.equal(byId.TSRC.text, meta.isrc);
    assert.equal(byId.TPUB.text, meta.publisher);
    assert.equal(byId.COMM.lang, 'eng');
    assert.equal(byId.COMM.text, meta.comment);

    const txxx = Object.fromEntries(
      parsed.frames.filter((f) => f.id === 'TXXX').map((f) => [f.description, f.value]),
    );
    assert.equal(txxx.SYNC_CONTACT, 'zaziediya@gmail.com');
    assert.equal(txxx.MOOD, meta.mood);
    assert.equal(txxx.CLEARANCE, '100% ONE-STOP (Both Master & Sync 100% Pre-cleared)');

    assert.deepEqual(Array.from(parsed.audioPayload), Array.from(fakeMpeg));
  });

  it('cleanly strips a pre-existing ID3v2 tag on re-tagging without duplicating headers', async () => {
    const { ctx } = createAppHarness();
    const rawMpeg = new Uint8Array([0xff, 0xfb, 0xe0, 0x00, 0xde, 0xad, 0xbe, 0xef]);

    const firstPass = await ctx
      .embedMp3ID3Metadata(rawMpeg.buffer, {
        title: 'Old Draft Title',
        artist: 'Old Artist',
        album: 'Drafts',
        year: '2024',
        genre: 'Ambient',
        bpm: '',
        key: '',
        isrc: '',
        publisher: '',
        comment: 'Temporary note with >128 bytes '.repeat(8),
        contact: 'old@example.com',
        mood: '',
      })
      .arrayBuffer();

    const secondPass = await ctx
      .embedMp3ID3Metadata(firstPass, {
        title: 'Final Master Title',
        artist: 'Zazie Productions',
        album: 'Final Reel',
        year: '2026',
        genre: 'Cinematic Tension',
        bpm: '92',
        key: 'A Minor',
        isrc: 'US-S1Z-26-00104',
        publisher: 'Zazie Productions LLC',
        comment: 'Final sync memo',
        contact: 'zaziediya@gmail.com',
        mood: 'Dark / Ominous',
      })
      .arrayBuffer();

    const parsed = parseId3v23(new Uint8Array(secondPass));
    assert.equal(parsed.frames.find((f) => f.id === 'TIT2').text, 'Final Master Title');
    assert.deepEqual(Array.from(parsed.audioPayload), Array.from(rawMpeg));
  });

  it('omits optional empty metadata fields rather than emitting empty text frames', async () => {
    const { ctx } = createAppHarness();
    const blob = ctx.embedMp3ID3Metadata(new Uint8Array([0xff, 0xfb]).buffer, {
      title: 'Minimal Cue',
      artist: 'Zazie',
      album: '',
      year: '',
      genre: '',
      bpm: '',
      key: '',
      isrc: '',
      publisher: '',
      comment: '',
      contact: '',
      mood: '',
    });
    const parsed = parseId3v23(new Uint8Array(await blob.arrayBuffer()));
    const ids = parsed.frames.map((f) => (f.id === 'TXXX' ? `TXXX:${f.description}` : f.id));
    assert.deepEqual(ids, ['TIT2', 'TPE1', 'TXXX:CLEARANCE']);
  });
});

describe('Binary Encoder — Broadcast WAV RIFF LIST/INFO (embedWavMetadata)', () => {
  it('appends 2-byte word-aligned LIST/INFO subchunks, updates LE32 RIFF size, and preserves PCM', async () => {
    const { ctx } = createAppHarness();
    const sourceWav = buildMinimalWav();
    const meta = {
      title: 'Odd', // "Odd\0" = 4 bytes (even)
      artist: 'Even', // "Even\0" = 5 bytes (odd -> requires 1 pad byte!)
      album: 'Sync Reel 4',
      genre: 'Cinematic Tension',
      year: '2026',
      masterOwner: 'Zazie Productions LLC (100%)',
      comment: '[SYNC CLEARANCE MEMO: 100% ONE-STOP]',
    };

    const blob = ctx.embedWavMetadata(sourceWav.buffer, meta);
    assert.equal(blob.type, 'audio/wav');
    const out = new Uint8Array(await blob.arrayBuffer());
    const view = new DataView(out.buffer);
    const ascii = new TextDecoder('ascii');
    const utf8 = new TextDecoder('utf-8');

    // Header & patched master RIFF size
    assert.equal(ascii.decode(out.slice(0, 4)), 'RIFF');
    assert.equal(view.getUint32(4, true), out.length - 8);
    assert.equal(ascii.decode(out.slice(8, 12)), 'WAVE');

    // Original fmt + data PCM bytes untouched
    assert.deepEqual(Array.from(out.slice(12, sourceWav.length)), Array.from(sourceWav.slice(12)));

    // Appended LIST/INFO chunk
    const listPos = sourceWav.length;
    assert.equal(ascii.decode(out.slice(listPos, listPos + 4)), 'LIST');
    const listSize = view.getUint32(listPos + 4, true);
    assert.equal(listPos + 8 + listSize, out.length);
    assert.equal(ascii.decode(out.slice(listPos + 8, listPos + 12)), 'INFO');

    const subchunks = {};
    let p = listPos + 12;
    while (p < out.length) {
      assert.equal(p % 2, 0, `Subchunk at offset ${p} must be 16-bit word-aligned`);
      const id = ascii.decode(out.slice(p, p + 4));
      const len = view.getUint32(p + 4, true);
      assert.equal(out[p + 8 + len - 1], 0x00, `${id} must be NUL-terminated`);
      subchunks[id] = utf8.decode(out.slice(p + 8, p + 8 + len - 1));
      if (len % 2 === 1) {
        assert.equal(out[p + 8 + len], 0x00, `${id} odd length must carry 0x00 pad byte`);
      }
      p += 8 + len + (len % 2);
    }

    assert.deepEqual(subchunks, {
      INAM: meta.title,
      IART: meta.artist,
      IPRD: meta.album,
      IGNR: meta.genre,
      ICRD: meta.year,
      ICOP: meta.masterOwner,
      ICMT: meta.comment,
    });
  });

  it('returns non-RIFF buffers byte-for-byte untouched without throwing', async () => {
    const { ctx } = createAppHarness();
    const nonRiff = new Uint8Array([0x46, 0x4f, 0x52, 0x4d, 0x00, 0x01, 0x02, 0x03]); // "FORM" (AIFF)
    const blob = ctx.embedWavMetadata(nonRiff.buffer, { title: 'Test' });
    const out = new Uint8Array(await blob.arrayBuffer());
    assert.deepEqual(Array.from(out), Array.from(nonRiff));
  });
});

describe('Vault Profiles, PRO PDF Parser, Readiness Scorer, Memo & Tap Tempo', () => {
  it('ships only the studio Vault preset, Zazie Productions (BMI) with label & website', () => {
    const { ctx, document, writerRows } = createAppHarness();
    const profiles = ctx.__state.syncProfiles;
    assert.equal(profiles.length, 1);

    const zazie = profiles.find((p) => p.id === 'profile_zazie');
    assert.ok(zazie);
    assert.equal(zazie.name, 'Zazie Productions (BMI)');
    assert.equal(zazie.recordLabel, 'Zazie Productions LLC');
    assert.equal(zazie.website, 'https://horror.zazieproductions.com');
    assert.equal(zazie.writers.length, 2);
    assert.equal(zazie.writers[0].ipi, '01280391067');
    assert.equal(zazie.writers[1].ipi, '01372389230');

    ctx.applyZazieProfile();
    assert.equal(document.getElementById('metaRecordLabel').value, 'Zazie Productions LLC');
    assert.equal(document.getElementById('metaWebsite').value, 'https://horror.zazieproductions.com');
    assert.equal(writerRows.length, 2);

    const memo = document.getElementById('metaComments').value;
    assert.match(memo, /RECORD LABEL: Zazie Productions LLC/);
    assert.match(memo, /WEBSITE \/ PORTFOLIO: https:\/\/horror\.zazieproductions\.com/);
    assert.match(memo, /IPI #01280391067/);
    assert.match(memo, /IPI #01372389230/);
  });

  it('saves a private local draft and imports metadata JSON snapshots without audio', () => {
    const { ctx, document, writerRows } = createAppHarness();
    document.getElementById('metaTitle').value = 'Zazie Cue';
    document.getElementById('metaArtist').value = 'Zazie Productions';
    assert.equal(ctx.saveDraft(true), true);

    const snapshot = ctx.__state.getEditorSnapshot();
    assert.equal(snapshot.metaTitle, 'Zazie Cue');
    assert.equal(snapshot.metaArtist, 'Zazie Productions');
    assert.equal(Object.hasOwn(snapshot, 'audio'), false);
    document.getElementById('metaTitle').value = 'Unsaved change';
    assert.equal(ctx.restoreDraft(true), true);
    assert.equal(document.getElementById('metaTitle').value, 'Zazie Cue');

    ctx.applyEditorSnapshot({
      metaTitle: 'Imported Cue',
      metaArtist: 'Zazie Productions',
      writers: [{ name: '<img src=x onerror=alert(1)>', pro: 'BMI', ipi: '01234567890', split: 100 }],
      genres: ['Cinematic Tension', 'not a preset'],
      moods: ['Suspenseful / Mysterious'],
    });
    assert.equal(document.getElementById('metaTitle').value, 'Imported Cue');
    assert.equal(writerRows.length, 1);
    assert.equal(writerRows[0].innerHTML.includes('<img'), false);
    assert.equal(writerRows[0].innerHTML.includes('&lt;img'), true);
    assert.deepEqual(Array.from(ctx.__state.selectedGenres), ['Cinematic Tension']);
    assert.deepEqual(Array.from(ctx.__state.selectedMoods), ['Suspenseful / Mysterious']);
  });

  it('stores searchable cue-library entries, updates the active cue, and removes records', () => {
    const { ctx, document } = createAppHarness();
    document.getElementById('metaTitle').value = 'Static Signal';
    document.getElementById('metaArtist').value = 'Zazie Productions';
    document.getElementById('cueCollection').value = 'Horror Trailer Reel';

    assert.equal(ctx.saveCueToCatalog(), true);
    assert.equal(ctx.__state.cueCatalog.length, 1);
    assert.equal(ctx.__state.cueCatalog[0].collection, 'Horror Trailer Reel');
    const id = ctx.__state.cueCatalog[0].id;

    document.getElementById('metaTitle').value = 'Updated Static Signal';
    assert.equal(ctx.saveCueToCatalog(), true);
    assert.equal(ctx.__state.cueCatalog.length, 1);
    document.getElementById('metaTitle').value = 'Unsaved title';
    assert.equal(ctx.loadCatalogCue(id), true);
    assert.equal(document.getElementById('metaTitle').value, 'Updated Static Signal');
    assert.equal(document.getElementById('cueCollection').value, 'Horror Trailer Reel');

    ctx.deleteCatalogCue(id);
    assert.equal(ctx.__state.cueCatalog.length, 0);
  });

  it('evaluates 100-pt Sync Readiness tiers for both 100% and 200% split conventions', () => {
    const { ctx, document, writerRows } = createAppHarness();
    const badge = document.getElementById('syncScoreBadge');
    const btn = document.getElementById('downloadBtn');

    // Boot state: Email(25) + Genres(10) + Moods(10) = 45% Missing Key Data, download locked
    ctx.calculateReadinessScore();
    assert.equal(badge.textContent, '25% Missing Key Data');
    assert.equal(btn.disabled, true);

    // Sample data + default 50/50 (100%) splits = 100% Sync Ready
    document.getElementById('metaISRC').value = 'US-S1Z-25-00812';
    ctx.fillSampleSyncData();
    assert.equal(badge.textContent, '100% Sync Ready');

    // Zazie profile uses 100% Writer + 100% Publisher (200% total) -> also 100% Sync Ready
    ctx.applyProfile(ctx.__state.syncProfiles[0]);
    assert.equal(badge.textContent, '100% Sync Ready');

    // Unbalanced split (e.g., 75% total) downgrades 100-pt score to "100% Adequate"
    writerRows[0].inputs[3].value = '50';
    writerRows[1].inputs[3].value = '25';
    ctx.calculateReadinessScore();
    assert.equal(badge.textContent, '100% Adequate');

    // Loading audio buffer unlocks download button
    ctx.__state.setAudioBuffer(new ArrayBuffer(16), 'cue.wav', 'audio/wav');
    ctx.calculateReadinessScore();
    assert.equal(btn.disabled, false);
  });

  it('extracts Work Title, BMI Work #, ISWC, and deduplicated IPIs from PRO PDF text', () => {
    const { ctx, document, writerRows } = createAppHarness();
    const samplePdfText =
      'BMI Work Registration Summary  Work Name: Subterranean Pulse BMI Work #: 68412093 ' +
      'ISWC: T-931.294.102-1 Writers: ZAZIE PRODUCTIONS IPI 01280391067 ' +
      'Publisher: ZAZIE PRODUCTIONS PUBLISHING IPI 01372389230 (dup 01280391067)';
    document.getElementById('metaTitle').value = 'subterranean-pulse!';

    const result = ctx.parseProRegistrationText(samplePdfText, 'bmi_work.pdf');
    assert.equal(result.matched, true);
    assert.equal(document.getElementById('metaTitle').value, 'subterranean-pulse!');
    assert.equal(document.getElementById('metaISWC').value, 'T-931.294.102-1 / #68412093');
    assert.equal(writerRows[0].inputs[2].value, '01280391067');
    assert.equal(writerRows[1].inputs[2].value, '01372389230');
  });

  it('leaves metadata unchanged when an uploaded registration title does not match', () => {
    const { ctx, document, writerRows } = createAppHarness();
    document.getElementById('metaTitle').value = 'Different Cue';
    document.getElementById('metaISWC').value = 'Existing work reference';
    const result = ctx.parseProRegistrationText(
      'BMI Work Name: Subterranean Pulse BMI Work #: 68412093 ISWC: T-931.294.102-1 IPI 01280391067',
      'registration.pdf',
    );
    assert.equal(result.matched, false);
    assert.equal(result.reason, 'title-mismatch');
    assert.equal(document.getElementById('metaTitle').value, 'Different Cue');
    assert.equal(document.getElementById('metaISWC').value, 'Existing work reference');
    assert.equal(writerRows[0].inputs[2].value, '00849204918');

    document.getElementById('metaTitle').value = '';
    const missingTitle = ctx.parseProRegistrationText('Work Name: Subterranean Pulse', 'registration.pdf');
    assert.equal(missingTitle.reason, 'missing-target');
  });

  it('computes BPM accurately over rolling 5-tap window and rejects out-of-range intervals', () => {
    const { ctx, document, advanceTime } = createAppHarness();
    // 500 ms interval = 120 BPM
    ctx.tapTempo();
    advanceTime(500);
    ctx.tapTempo();
    advanceTime(500);
    ctx.tapTempo();
    assert.equal(document.getElementById('metaBPM').value, 120);

    // Out-of-range slow tap (10000 ms pushes avg interval to 3667 ms = 16 BPM <= 40) is ignored
    advanceTime(10000);
    ctx.tapTempo();
    assert.equal(document.getElementById('metaBPM').value, 120);

    // Out-of-range hyper-fast taps (50 ms = 1200 BPM >= 240) are also ignored
    for (let i = 0; i < 5; i++) {
      advanceTime(50);
      ctx.tapTempo();
    }
    assert.equal(document.getElementById('metaBPM').value, 120);
  });

  it('exposes exactly 12 preset sync genres and 12 preset sync moods', () => {
    const { ctx } = createAppHarness();
    assert.equal(ctx.__state.PRESET_GENRES.length, 12);
    assert.equal(ctx.__state.PRESET_MOODS.length, 12);
    assert.equal(ctx.__state.selectedGenres.size, 0);
    assert.equal(ctx.__state.selectedMoods.size, 0);
  });
});

describe('Privacy, Assets & Documentation Integrity', () => {
  it('contains zero outbound network calls (fetch, XMLHttpRequest, WebSocket, sendBeacon) in index.html', () => {
    assert.doesNotMatch(HTML_SOURCE, /\bfetch\s*\(/);
    assert.doesNotMatch(HTML_SOURCE, /\bXMLHttpRequest\b/);
    assert.doesNotMatch(HTML_SOURCE, /\bWebSocket\b/);
    assert.doesNotMatch(HTML_SOURCE, /\bsendBeacon\b/);
  });

  it('has well-formed accessible SVG diagrams in docs/diagrams/', () => {
    const diagDir = resolve(ROOT, 'docs/diagrams');
    const svgs = readdirSync(diagDir).filter((f) => f.endsWith('.svg'));
    assert.ok(svgs.length >= 4, 'Expected at least 4 SVG diagrams');
    for (const file of svgs) {
      const content = readFileSync(join(diagDir, file), 'utf8');
      assert.match(content, /^<svg\b[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
      assert.match(content, /<title\b[^>]*>[^<]+<\/title>/, `${file} missing <title>`);
      assert.match(content, /<desc\b[^>]*>[^<]+<\/desc>/, `${file} missing <desc>`);
      assert.match(content, /<\/svg>\s*$/, `${file} missing closing </svg>`);
      // Reject unescaped bare ampersands outside XML comments
      const withoutComments = content.replace(/<!--[\s\S]*?-->/g, '');
      assert.doesNotMatch(
        withoutComments,
        /&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/,
        `${file} has unescaped &`,
      );
    }
  });

  it('resolves every relative file link and in-page heading anchor across all Markdown docs', () => {
    const mdFiles = [
      'README.md',
      'CHANGELOG.md',
      'CONTRIBUTING.md',
      'CODE_OF_CONDUCT.md',
      'SECURITY.md',
      ...readdirSync(resolve(ROOT, 'docs'))
        .filter((f) => f.endsWith('.md'))
        .map((f) => `docs/${f}`),
    ];

    // Exact github-slugger heading normalization (preserves double hyphens from " & " / " — ")
    const slugify = (heading) =>
      heading
        .trim()
        .toLowerCase()
        .replace(/`([^`]*)`/g, '$1')
        .replace(/<[^>]+>/g, '')
        .replace(/[^\p{L}\p{N} \-_]/gu, '')
        .replace(/ /g, '-');

    const slugCache = new Map();
    for (const relPath of mdFiles) {
      const absPath = resolve(ROOT, relPath);
      assert.ok(existsSync(absPath), `Missing expected doc: ${relPath}`);
      const stripped = readFileSync(absPath, 'utf8').replace(/```[\s\S]*?```/g, '');
      const slugs = new Set();
      for (const h of stripped.matchAll(/^#{1,6}\s+(.+)$/gm)) {
        slugs.add(slugify(h[1]));
      }
      for (const a of stripped.matchAll(/\bid="([^"]+)"/g)) {
        slugs.add(a[1]);
      }
      slugCache.set(absPath, { relPath, stripped, slugs });
    }

    for (const [absPath, { relPath, stripped }] of slugCache.entries()) {
      const linkRe = /!?\[[^\]]*\]\(([^)]+)\)/g;
      let m;
      while ((m = linkRe.exec(stripped)) !== null) {
        const raw = m[1].trim().split(/\s+/)[0];
        if (/^(https?:|mailto:|data:)/i.test(raw)) continue;

        const [filePart, anchor] = raw.split('#');
        const target = filePart ? resolve(dirname(absPath), filePart) : absPath;
        assert.ok(existsSync(target), `Broken relative link "${raw}" in ${relPath}`);
        if (anchor && slugCache.has(target)) {
          assert.ok(
            slugCache.get(target).slugs.has(anchor),
            `Broken heading anchor "${raw}" in ${relPath}`,
          );
        }
      }
    }
  });
});

it('reads embedded MP3 and WAV text tags without treating untagged audio as metadata', async () => {
  const { ctx } = createAppHarness();
  const meta = { title: 'Café', artist: 'Band', comment: 'Original memo' };
  const mp3 = ctx.embedMp3ID3Metadata(new ArrayBuffer(4), meta);
  const wav = ctx.embedWavMetadata(buildMinimalWav().buffer, meta);
  for (const [blob, title, comment] of [[mp3, 'TIT2', 'COMM'], [wav, 'INAM', 'ICMT']]) {
    const tags = ctx.readEmbeddedTags(await blob.arrayBuffer());
    assert.equal(tags.get(title), meta.title);
    assert.equal(tags.get(comment), meta.comment);
  }
  assert.equal(ctx.readEmbeddedTags(new ArrayBuffer(2)).size, 0);
});

it('distinguishes master and publishing control without asserting a license', () => {
  const { ctx, document } = createAppHarness();
  document.getElementById('metaClearance').value = '';
  document.getElementById('metaPublisher').value = 'Composition administrator (50%, US)';
  ctx.updateCommentsField();
  const memo = document.getElementById('metaComments').value;
  assert.match(memo, /^CLEARANCE: Not verified/);
  assert.match(memo, /PUBLISHING CONTROL: Composition administrator \(50%, US\)/);
  assert.doesNotMatch(memo, /worldwide|pre-cleared/i);
});
