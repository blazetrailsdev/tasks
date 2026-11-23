---
title: "Run check:hero on PRs touching examples/homepage, trails-tsc or tse-compiler"
status: ready
updated: 2026-11-23
rfc: "0247-website-refresh"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10590 added `pnpm --filter @blazetrails/example-homepage check:hero` to the CI Website job (`.github/workflows/ci.yml`, after "Build docs"). It compiles the hero's edits in `examples/homepage/hero/` and checks the errors against `hero/errors.json`. The Website job is gated by `WEBSITE_PKGS_RE='^packages/website/'` (`ci.yml` line ~149; rationale in `scripts/ci-suite-coverage.test.ts`). So a PR that changes `examples/homepage/**`, `packages/trails-tsc/**` or `packages/tse-compiler/**` (which change the hero output) skips the check, and the drift surfaces only on the post-merge push to main.

## Acceptance criteria

- `WEBSITE_PKGS_RE` (or a separate gate for a lighter job) includes `examples/homepage/`.
- Changes to trails-tsc and tse-compiler also run `check:hero` on the PR, either through that gate or through a small job that only builds those packages and runs the check.
- `scripts/ci-suite-coverage.test.ts`'s description of the regex is updated to match.
