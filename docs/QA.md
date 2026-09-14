# Verification — 14 September 2026

## Original implementation checks (historical)

- Production Astro build passed. Static output in `dist/`.
- Chromium and WebKit end-to-end checks passed: play/pause, progress, exclusive playback when switching conditions, seek to 02:00, shared volume, repeat, all four chart tabs, comparison, keyboard tab navigation, lighting matrix and disclosure credits.
- No JavaScript errors in either browser during the completed end-to-end run. Temporary Vite re-optimisation errors occurred while editing configuration; a fresh session with the settled build passed.
- No horizontal overflow at 320, 360, 390, 768, 1440 and 1920 px in both browsers.
- Reduced-motion preference respected; no autoplay; audio resources absent from initial load.
- Both generated spectrograms loaded. Store photographs were extracted from the supplied PDF and verified visually. UCL logo extracted from the August presentation.
- Desktop, mobile and comparative spectrogram screenshots reviewed.
- Axe automated accessibility check: 0 violations. Plot labels use #aaa99f over #171816; semantic chart titles and textual metrics supplement graphs. Keyboard-controlled sliders provide an alternative to pointer seeking on charts.
- Required player/chart JavaScript only, with D3 scale/shape modules; no framework hydration, remote fonts or external chart services. CSS inlined by Astro; images optimized via Astro assets with explicit dimensions and lazy loading.
- Metadata: English document language, unique title and description, Open Graph text, theme colour and project favicon. Canonical is intentionally unset until a production domain exists. No social image was requested.
- The onepage remains local; no publishing or source-control operations were performed.

## Reproduce

`npm run build` checks production compilation.

`NODE_PATH=/path/to/node_modules node scripts/verify-browser.cjs` runs the interaction suite against port 4321 with a runtime containing Playwright Chromium and WebKit. Detailed results are in `browser-results.json`.

Audio analysis runtime used:
`/Users/tiagolima/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/analyze_audio.py`

FFmpeg EBU R128 measurements on the original stereo files:

| Condition | Duration | Integrated | LRA | True peak |
| --- | --- | --- | --- | --- |
| 68 BPM | 87:38.136 | −10.0 LUFS | 5.3 LU | +0.8 dBTP |
| 118 BPM | 85:59.352 | −9.2 LUFS | 3.7 LU | +0.9 dBTP |

These are measurements of the supplied masters, not target specifications. Files are unaltered. BPM is the supplied condition label. Sound pressure and lighting measurements from the physical experiment are not provided or inferred. Looping uses native playback and is not certified gapless. Spectra are aggregated across time and limited to the documented 12 kHz analysis band.

## Lighthouse — original production build (historical)

Mobile audit on the original local production preview: Performance 99, Accessibility 100, Best practices 100, SEO 100. See `lighthouse-results.json`. Scores are local audit results, not a guarantee for a different host or network. Visible labels and accessible names now match.

## Playhead update

Implemented audio-synchronised time labels on waveform, spectrogram and loudness; click/drag seeking; local analysis transport; lazy-loaded frequency spectra for each measured 5-second segment; reference-inspired spectrogram palette. Name replaced with module BENV0008 25/26 in visible copy and metadata.

Production build and static dataset integrity checks passed. After an initial approval-tool usage-limit block, the prepared local test was approved and executed successfully in Chromium and WebKit. Verified play/pause, labelled waveform and loudness playheads, spectrogram click/drag seeking, segment spectra changing with the selected time, comparison preserved during playback, keyboard seeking, responsive layouts and zero JavaScript errors. See `playhead-results.json`. Earlier Lighthouse scores apply to the previous revision.

## Unified player and live FFT — current revision

Production build passed. `scripts/verify-unified.cjs` passed in Chromium and WebKit, with results in `unified-results.json`:

- One shared transport, no MP3 preload, exclusive playback when changing conditions.
- Actual AnalyserNode data changes within a 180 ms observation interval, independently of the offline 5-second analysis.
- FFT size and response controls update the real analyser configuration.
- Freeze preserves the canvas while playback time advances; unfreeze resumes visual updates. Pause holds the spectrum.
- Zero playback gain leaves the analyser signal available, verified by reading the analyser directly.
- File-average comparison shows both recordings; live mode follows the one selected recording.
- Waveform, loudness and spectrogram playheads, click/drag seeking, keyboard seeking, keyboard tabs and repeat all pass.
- No horizontal overflow at 320, 390, 768, 1440 and 1920 px. Desktop and mobile screenshots reviewed.
- No JavaScript errors. No offline segment spectra fetched by the new player.

The earlier Lighthouse and accessibility reports are historical and were not rerun for this revision. The browser suites for the earlier layouts are preserved as historical scripts; use verify-unified.cjs for the current interface. Live spectrum is a Web Audio analysis of the supplied audio, not an emulation or calibration of Ableton Spectrum. It shares a playback gain stage after analysis and uses a separate FFT window and time resolution from File average. Methodology and README now explain that distinction.
