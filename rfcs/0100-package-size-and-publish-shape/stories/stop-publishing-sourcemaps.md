---
title: "Stop publishing sourcemaps (or only .js.map)"
status: draft
updated: 2026-08-11
rfc: "0100-package-size-and-publish-shape"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 40
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Sourcemaps are **12.16 MB of the 28.49 MB** that `@blazetrails/activerecord`
publishes (43%), in 3,118 of its 6,239 files: `.js.map` 10.90 MB and
`.d.ts.map` 1.26 MB.

`.d.ts.map` is pure waste today — it exists so an editor can jump from a
`.d.ts` into the original `.ts`, and the package ships no `src/`
(`"files": ["dist", "bin"]`, `packages/activerecord/package.json:95-98`), so
the jump target does not exist on a consumer's disk.

`.js.map` is a real judgement call: it buys a consumer readable stack traces
into trails internals. The options are (a) drop both, (b) keep `.js.map` and
drop `.d.ts.map`, (c) ship maps but also ship `src/` so they resolve. This
story picks one deliberately and writes down why; it does not need to pick (a).

Measured: with tests already excluded (see
`exclude-compiled-tests-from-published-dist`), removing all remaining maps
takes the package from 11.47 MB / 1,684 files to **7.36 MB / 842 files**, and
the gzipped tarball to ~1.87 MB.

## Acceptance criteria

1. A decision is made and recorded in the RFC README: which map kinds ship, and
   why.
2. `.d.ts.map` is not published (it cannot resolve without `src/`), unless the
   decision is to publish `src/` too — in which case the closure cost of that
   is measured and recorded.
3. Applied consistently across `packages/*`, driven by the shared tsconfig
   rather than per-package overrides where possible.
4. `pnpm build` still emits maps for local development; only the published
   artifact changes.
5. Before/after `npm pack --dry-run --json` numbers in the PR body.
