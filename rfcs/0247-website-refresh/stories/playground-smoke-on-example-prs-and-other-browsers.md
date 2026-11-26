---
title: "Playground smoke runs on example-only PRs and in Firefox and WebKit"
status: ready
updated: 2026-11-26
rfc: "0247-website-refresh"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10753 added the playground's smoke walk to CI: `ci.yml`'s System Tests job runs `pnpm --filter @blazetrails/example-browser-sqlite smoke`, and `pages.yml` runs it over the built bundle before deploy. System Tests is gated on `actionpack_affected || trailties_affected`. A PR that touches only `examples/browser-sqlite/**` is classed `docs_only` by the `changes` job (`.github/workflows/ci.yml`, the `grep -qvE '^docs/|^examples/|...'` arm), so it skips System Tests and the first run of its change is the Pages build on `main`, where a failure blocks the whole site's deploy.

The `changes` job's `run:` script is close to the Actions size limit, so a new gate has to be small or live in a script file.

Separately, the smoke runs in Chromium only. Firefox and Safari were not exercised for trails#10753's changes (stateless service worker, `execCommand("insertText")` editing, `CompressionStream` share links).

## Acceptance criteria

- A PR that changes `examples/browser-sqlite/**` runs the playground smoke before merge.
- The smoke runs in Firefox and WebKit as well as Chromium, in CI or as a documented `BROWSER=` option of `scripts/smoke.mjs` that was run once with the results in the PR. The CDP-only step (stopping the service worker) is skipped off Chromium.
- Any failure the other engines show is fixed or filed.
