---
title: "lint: enroll a second package in the rails-test-name-parity ratchet"
status: draft
updated: 2026-08-27
rfc: "0124-arel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7131 landed `blazetrails/rails-test-name-parity` — a per-`it()` rule that
flags a test in a Rails-named `*.test.ts` whose name matches no Rails test in
its counterpart, with a per-file only-shrink mark
(`eslint/rails-test-name-parity-mark.json`, tightened by
`pnpm parity:test:names:tighten`). Only `packages/arel/src/**/*.test.ts` is
enrolled, and its mark is `{}` — a hard zero — because #7125 had already moved
arel's 297 TS-only tests into `.trails.test.ts` twins.

The other packages have not had that cleanup, so `pnpm parity:test` still
reports large "extra (TS only)" counts for them. Enrolling each one needs:

1. `PACKAGE_DIRS` in `scripts/build-rails-test-names-manifest.ts` extended
   (currently `{ arel: "packages/arel/src" }`).
2. `ENROLLED` in `scripts/tighten-rails-test-name-parity.ts` extended (kept in
   sync with the rule's `files` block in `eslint.config.mjs`).
3. A seeded mark via `pnpm tsx scripts/tighten-rails-test-name-parity.ts --seed`
   so the gate is green on day one, then burnt down by moving tests to their
   `.trails.test.ts` twins.

Enrollment is ONLY-GROW, like the `unbacked-internal-needs-receipt` set: a
package joins once seeded and is never removed to turn a red run green.

## Acceptance criteria

- One package (pick the smallest extra count first) joins all three lists
  above with a seeded mark, and the CI step
  `Rails test-name parity ratchet` in `.github/workflows/ci.yml` lints it.
- `pnpm parity:test` percentages unchanged; no test renamed.
- A follow-up story per remaining package, or one story per package filed here.
