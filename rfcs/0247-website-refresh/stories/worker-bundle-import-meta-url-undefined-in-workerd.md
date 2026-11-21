---
title: "trails reads import.meta.url / import.meta.dirname, which workerd leaves undefined"
status: in-progress
updated: 2026-11-21
rfc: "0247-website-refresh"
cluster: null
packages: ["activesupport", "trailties"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#10512
claim: "2026-11-21T18:29:36Z"
assignee: "retake-the-body-pin-floor-at-the-last-8-0-2-commit"
blocked-by: null
closed-reason: null
---

## Context

In workerd, `import.meta.url` is undefined, so `packages/activesupport/lib/i18n.ts`'s
`new URL("./locale/en.js", import.meta.url)` throws "Invalid URL string" at module evaluation, and
`Application.register(this, import.meta.dirname)` passes `undefined` (`findRoot` then falls back to the
cwd, `/bundle`). `examples/cloudflare-worker/bundle.mjs` works around the first with an esbuild `define`
of `import.meta.url` as `file:///bundle/dist/worker.js`, and the second by uploading `config.ts` so the cwd
fallback finds the root.

## Acceptance criteria

- [ ] Every module-evaluation read of `import.meta.url` in framework packages tolerates its absence, or the
      example documents the `define` as the supported Workers recipe in the deployment guide.
- [ ] `examples/cloudflare-worker/bundle.mjs` needs no `define` for `import.meta.url`, or the guide records why.
