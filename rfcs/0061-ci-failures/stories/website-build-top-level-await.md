---
title: "Fix the Website build's top-level-await failure and re-enable the CI job"
status: done
updated: 2026-08-13
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6479
claim: "2026-08-13T18:20:30Z"
assignee: "website-build-top-level-await"
blocked-by: null
closed-reason: null
---

## Context

The `Website` CI job has been failing on `main` and was disabled in
`.github/workflows/ci.yml` (`if: false &&` on the `website:` job, plus an
unconditional `continue` in the `ci` aggregate's `website)` skip case). This
story tracks the underlying build failure so re-enabling has a starting point.

Failing step: **Build SvelteKit** —
`pnpm --filter @blazetrails/website run build:sw`
(`vite build --config vite.sw.config.ts`), e.g. run 31726034643 / job
94534581328 on `main`:

```text
error during build:
Module format "iife" does not support top-level await. Use the "es" or "system" output formats rather.
file: packages/activesupport/src/yaml.ts
```

The service-worker bundle (`vite.sw.config.ts`) emits `iife`, which cannot
carry a top-level `await`. `packages/activesupport/src/yaml.ts` acquired one
and is reachable from the SW entry's import graph. The docs build
(`docs:build`) never ran, so there may be further breakage behind this one.

## Acceptance criteria

- `pnpm --filter @blazetrails/website run build:sw` and
  `pnpm --filter @blazetrails/website run docs:build` both pass locally.
- The top-level `await` in `packages/activesupport/src/yaml.ts` no longer
  reaches an `iife`/`cjs` bundle (make the initialization lazy, or keep the
  module out of the SW graph — do not switch the SW output format without
  checking SW compatibility).
- Re-enable the job: delete the leading `false &&` from the `website:` job's
  `if:` in `.github/workflows/ci.yml`, and restore the original
  `website_affected` / `website_label` condition in the `ci` aggregate's
  `website)` case (replacing the unconditional `continue`).
- `pnpm vitest run scripts/ci-suite-coverage.test.ts` stays green.
