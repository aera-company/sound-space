# Overview and interaction review — 15 September 2026

Replaced the low-resolution experiment overview with a Remotion composition and a vector SVG exported from the same artwork. Original condition labels, dates and respondent counts are preserved. The animation highlights conditions sequentially; it does not depict measured time series or infer effects.

Rendered H.264: 1920 × 1680, 30 fps, 8 seconds, no audio, 216,577 bytes. Vector poster: resolution independent. Remotion dependencies remain isolated from the Astro site; the browser uses native video, loaded on visibility or explicit play.

The UI/UX Pro Max review informed motion restraint, accessible controls, readable supporting text and selective client code. The existing palette and editorial typography remain. Added real excerpt progress, SVG play/stop states, selected-recording underline, location-aware navigation, subtle pointer transitions, and restrained reveals for contextual content. Keyboard navigation stays direct; reduced motion suppresses automatic animations.

Verification:
- Remotion ESLint and TypeScript passed; Astro production build passed.
- `scripts/verify-overview.cjs` passed in Chromium desktop and WebKit mobile: video playback/dimensions, pause, replay, offscreen pause, keyboard pause, vector final frame, accessible data table, reduced motion, photo progress and focus restoration.
- No horizontal overflow at widths 320, 390, 768, 1440 and 1920.
- `scripts/verify-media.cjs` passed in both engines: X3 audio playback, HTTP Range, real FFT, timeline seeking, comparison, four photo excerpts, 30-second stop, silent film, light labels and reduced motion.
- Desktop and mobile screenshots inspected. The HTML data table provides readable dates/counts on narrow screens in addition to the compact matrix.

Reproduce with the production preview on port 4322 and Playwright available through NODE_PATH. The overview test also accepts SITE_URL for published-site verification. Results are in overview-results.json and media-results.json.
