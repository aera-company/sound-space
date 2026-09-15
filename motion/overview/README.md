# Experimental overview

Recreation of the supplied experiment overview in Remotion, using the existing UCL palette and original condition labels, dates and respondent counts (25, 37, 30, 36). No research outcomes are inferred.

## Generate

```sh
npm ci
npm run lint
npm run poster
npm run render
```

`poster` exports the final frame as an SVG to `public/analysis/experiment-overview.svg`. `render` writes an 8-second, 1920 × 1680 H.264 video to `public/video/overview.mp4`. Remotion downloads Chrome Headless Shell on first render. Both outputs share `OverviewArtwork` in `src/Composition.tsx`. All animation is driven by the Remotion frame, without CSS animation.

The site uses native video, not a React player. It shows the vector artwork before playback and after completion, plays once when visible, offers pause/replay, and disables automatic playback with reduced motion. The accessible HTML table remains available without JavaScript.

`npm run dev` opens Remotion Studio. Dependencies are isolated from the Astro production bundle.

Remotion is subject to its upstream license: https://github.com/remotion-dev/remotion/blob/main/LICENSE.md.
