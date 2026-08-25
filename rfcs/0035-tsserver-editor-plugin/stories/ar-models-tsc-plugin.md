---
title: "Register ar-models TscPlugin wrapping the virtualizer"
status: closed
updated: 2026-08-09
rfc: "0035-tsserver-editor-plugin"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already shipped: createArModelsPlugin(): TscPlugin (name 'ar-models', extensions .ts/.tsx/.mts/.cts) lives at packages/activerecord-cli/src/tsc-wrapper/ar-models-plugin.ts:41, wraps virtualize() with a shouldVirtualize pre-filter (:46-66), maps {text,deltas}→{ts,deltas} (:79), and is wired into the CLI host at tsc-wrapper/ar-program.ts:31,57. It landed in activerecord-cli rather than activerecord (keeps the node-free boundary), which is the only divergence from the story."
---

## Context

The AR virtualizer (`packages/activerecord/src/type-virtualization/virtualize.ts`,
`virtualize(text, fileName, opts): { text, deltas }`) is shipped but not exposed
to `trails-tsc`. `packages/trails-tsc/src/plugin.ts` defines `TscPlugin`
(`{ name, extensions, virtualize(filePath, source): { ts, deltas } | null }`)
and its doc comment names the future `ar-models` plugin. No
`packages/activerecord/bin/trails-tsc.js` or AR `TscPlugin` exists yet.

## Acceptance criteria

- New `createArModelsPlugin(): TscPlugin` (`name: "ar-models"`,
  `extensions: [".ts"]`) wrapping `virtualize()`; returns `null` for files with
  no Base-rooted `static {}` (reuse the existing fast pre-filter).
- Maps AR `VirtualizeResult { text, deltas }` to `VirtualizeOutput { ts, deltas }`.
- Wired into the `trails-tsc` CLI host (`buildCompilerHost` plugins list) so a
  zero-declare model typechecks through the shared host path.
- Unit tests on a flat `extends Base` fixture; under the LOC ceiling.
