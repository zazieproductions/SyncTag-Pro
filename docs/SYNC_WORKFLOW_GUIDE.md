# Sync Licensing Workflow Guide

> **Audience:** Film/TV composers, sync licensing reps, production music libraries, and catalog administrators preparing tracks for music supervisors, trailer houses, networks, and ad agencies.

---

## 1. Why Embedded Metadata Wins Sync Placements

When a music supervisor downloads 80 pitched tracks from DISCO, Box, or email into a local Premiere/Avid temp bin or iTunes playlist, filenames get renamed and email threads disappear. A track without embedded contact, PRO/IPI, and one-stop clearance metadata becomes an **"orphan track"** — legally un-clearable on a 24-hour broadcast turnaround and immediately dropped from the edit.

SyncTag Pro stamps every required clearance artifact directly inside the audio file binary in under 30 seconds:

1. **Who clears it right now?** — Direct licensing email, phone number, record label, and portfolio URL.
2. **Is it One-Stop?** — Explicit clearance warranty (`100% ONE-STOP`, `200% Pre-Cleared`, `Master Only`, or `Buyout`).
3. **Who goes on the cue sheet?** — Exact writer & publisher legal names, PRO affiliations (`BMI`, `ASCAP`, `SESAC`, `PRS`, `SOCAN`, `GEMA`), 9–11 digit IPI/CAE numbers, and percentage splits.
4. **How do royalties track?** — ISO 3901 `ISRC` (master recording) and CISAC `ISWC` / PRO Work ID (composition).
5. **How does an editor search for it?** — Tempo (BPM), musical key, stem/version type, explicit/clean status, genre & mood taxonomy, RIYL ("Sounds Like") references, and scene notes.

---

## 2. Standard 5-Step Tagging Workflow

### Step 1 — Load Your Master Audio

- Drag a broadcast `.wav` (16/24-bit, 44.1/48 kHz) or 320 kbps `.mp3` onto **Panel 1: Audio Source File** (or click to browse).
- If `#metaTitle` is empty, SyncTag Pro strips the file extension and converts hyphens/underscores into spaces automatically.
- Audition the cue directly in the mini deck using **Play/Pause** and **Stop**.

### Step 2 — Apply a Publisher / Writer Vault Profile

- Click a preset pill in **Panel 3: Pre-Set Publisher / Writer Vault** (e.g., **Zazie Productions (BMI)**) or open the **Active Vault Profile** database modal in the top navigation bar.
- Artist, Master Owner, Record Label, Website/Portfolio, Licensing Email, Phone, Clearance Guarantee, and all Writer/Publisher split rows fill instantaneously.
- Working on a custom co-write? Adjust the split rows and click **Save Active** to store the entity in the session Vault for tagging remaining stems (`Instrumental`, `TV Mix`, `60s`, `30s`).

### Step 3 — Auto-Fill Registration & Catalog IDs (Optional)

Choose either (or both) ingest tiles in **Panel 2: Smart Document Auto-Fill**:

- **BMI / ASCAP PDF** — Drop a PRO work registration confirmation PDF to extract Work Title, Work #, ISWC, and IPI/CAE numbers.
- **ISRC Catalog CSV** — Drop your catalog spreadsheet (see [`samples/sample-isrc-catalog.csv`](samples/sample-isrc-catalog.csv)) and click **Match** next to the target cue to populate Title, Artist, ISRC, BPM, Key, and Sounds Like.

### Step 4 — Dial In Musical & Sonic Search Terms

- Set **Version / Stem Type** (`Full Instrumental`, `Full Vocal Master`, `TV Mix`, `Underscore`, `60s`, `30s`, `Full Stems Available`).
- Enter **BPM** directly or click **TAP** in rhythm with playback (2–5 taps averages your tempo automatically between 41 and 239 BPM).
- Select **Musical Key** and **Explicit Lyrics** status (`Clean / Safe for Broadcast` or `Pure Instrumental` for network TV).
- Toggle relevant **Sync Genre** (indigo) and **Sync Mood & Vibe** (emerald) pills, and refine **Sounds Like / RIYL** and **Ideal TV / Film Placements**.
- Confirm the top-right badge turns green: **`100% Sync Ready`**.

### Step 5 — Embed & Export

- Click **Embed & Export** in the header.
- SyncTag Pro injects the binary tags with zero audio re-encoding and downloads `{Artist} - {Title} (Sync Ready).{wav|mp3}`.
- Repeat Steps 1, 4 (Version selector), and 5 for each alternate mix/cutdown in your stem pack while keeping your Vault profile and rights matrix locked in.

---

## 3. Document Ingestion Schemas

### 3.1 BMI / ASCAP PDF Regex Heuristics

`parseProRegistrationText()` scans extracted text from pages `1..5` of uploaded PDFs using four deterministic rules:

| Target Field | Pattern Summary | Example Input | Destination |
|---|---|---|---|
| **Work Title** | `(?:Title\|Work Name\|Song Title):\s*([A-Za-z0-9\s\-&]+?)` (up to `Work #`, `ISWC`, `BMI`, `ASCAP`, `Writers`, or EOL) | `Work Name: Subterranean Pulse` | `#metaTitle` |
| **PRO Work ID** | `(?:Work\s*(?:#\|ID\|No\.?)\|BMI Work #)\s*[:]?\s*([0-9]{5,12})` | `BMI Work #: 68412093` | `#metaISWC` (as `#68412093`) |
| **ISWC** | `(T-[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9])` | `T-931.294.102-1` | `#metaISWC` (joined with Work ID via ` / `) |
| **IPI / CAE #** | `\b00[0-9]{7,9}\b\|\b[0-9]{9,11}\b` (deduplicated in order) | `01280391067`, `01372389230` | Sequential `.writer-row` IPI inputs |

> **Tip:** Scanned image-only PDFs contain no selectable text layer. Export digital PDFs directly from your BMI Online Services or ASCAP Member Access portal, or run OCR beforehand.

### 3.2 ISRC Catalog CSV / TSV Column Mapping

Upload any UTF-8 `.csv`, `.tsv`, or delimited `.txt` file with a header row. SyncTag Pro recognizes common distributor, DISCO, and studio header aliases automatically (displaying the first 10 rows in the quick-match drawer):

| Metadata Field | Recognized Column Headers (Priority Order) | Destination Control |
|---|---|---|
| **Track Title** *(required)* | `Title` → `Track Title` → `Song` → `Track` → `Name` → *(Column 1 fallback)* | `#metaTitle` |
| **ISRC Code** | `ISRC` → `ISRC Code` → `isrc` | `#metaISRC` |
| **Tempo (BPM)** | `BPM` → `Tempo` | `#metaBPM` |
| **Musical Key** | `Key` → `Tone` *(must match option value, e.g. `D Minor`, `A Minor`, `C Major`)* | `#metaKey` |
| **Artist** | `Artist` | `#metaArtist` |
| **Sounds Like / RIYL** | `Sounds Like` | `#metaSoundsLike` |

#### Ready-to-Use CSV Example

```csv
Title,Artist,ISRC,BPM,Key,Sounds Like
Quantum Horizon (Trailer Mix),Zazie Productions,US-S1Z-25-00812,130,D Minor,"Hans Zimmer, Junkie XL, Interstellar"
Subterranean Pulse (Instrumental),Zazie Productions,US-S1Z-26-00104,92,A Minor,"Trent Reznor, Atticus Ross, Hildur Gudnadottir"
```

---

## 4. Split Accounting: 100% vs. 200% Convention

Both major US/international PRO split conventions validate as **`100% Sync Ready`** in SyncTag Pro:

| Convention | Writer Share | Publisher Share | Total Entered | Typical Usage |
|---|---|---|---|---|
| **100% Combined Pie** | `50%` | `50%` | **`100%`** | ASCAP registration summaries, standard cue sheets (`50/50`) |
| **200% Dual-Side Pie** | `100%` | `100%` | **`200%`** | BMI Works registration schedules (e.g., `Zazie Productions (BMI)` preset: 100% Writer + 100% Publisher) |

For co-writes, split each side proportionally so the combined total equals either `100` (e.g., `25 + 25 + 25 + 25`) or `200` (e.g., `50 + 50` writers + `50 + 50` publishers).

---

## 5. Generated Broadcast Sync Clearance Memo Format

Every change to the form updates `#metaComments` using this standardized template (with `RECORD LABEL` and `WEBSITE / PORTFOLIO` lines included automatically whenever populated):

```text
[SYNC CLEARANCE MEMO: 100% ONE-STOP (BOTH MASTER & SYNC 100% PRE-CLEARED)]
DIRECT CONTACT: zaziediya@gmail.com | +1 (864) 430-0606
MASTER OWNER: Zazie Productions LLC (100%)
RECORD LABEL: Zazie Productions LLC
WEBSITE / PORTFOLIO: https://horror.zazieproductions.com
WRITERS / PUBLISHERS: Zazie Productions [BMI (IPI #01280391067) - 100%] // Zazie Productions Publishing [BMI (IPI #01372389230) - 100%]
TEMPO: 130 BPM | KEY: D Minor
GENRES: Cinematic Tension, Trailer Hybrid Orchestral
MOODS: Building / Crescendo, Suspenseful / Mysterious
RIYL / SOUNDS LIKE: Hans Zimmer, Junkie XL, Interstellar
*All splits 100% pre-cleared for worldwide all media sync synchronization licensing.*
```

You can also hand-edit `#metaComments` immediately before clicking **Embed & Export** (for example, to append a custom restriction note, agency brief reference number, or stem download link) — `triggerDownload()` embeds the exact text present in `#metaComments` at export time.
