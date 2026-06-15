---
title: "Continue rails-error-parity bare-throw burndown (ar/am remaining ~126 files); port missing Ruby bases (RuntimeError, FrozenError) needed by guard sites"
status: in-progress
updated: 2026-06-15
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 3374
claim: "2026-06-15T16:48:26Z"
assignee: "rails-error-parity-bare-throw-burndown-continue"
blocked-by: null
---

## Context

Follow-on to `rails-error-parity-bare-throw-burndown` (PR #3250, done), which
established the `blazetrails/rails-error-parity` ESLint rule
(`eslint/rails-error-parity.mjs`) banning `throw new Error(` / `TypeError` / …
(the `NATIVE_ERRORS` set) in Rails-mirroring source and requiring ported error
classes instead. Pre-existing violators are grandfathered in the ratchet
baseline `eslint/rails-error-parity-exclude.json`, which **only shrinks**.

The baseline still lists **173 files** across `activemodel`, `activerecord`,
and `activesupport`. Each bare `throw new Error(...)` in those files should be
replaced with the ported Rails error class for that site, then the file removed
from the exclude list (the ratchet enforces it never grows again).

Two structural notes for the implementer:

- The error class must exist in the manifest
  (`eslint/rails-error-classes.json`, regenerated via
  `pnpm tsx scripts/build-rails-error-manifest.ts`) and be exported from the
  package's `errors.ts` with the correct `extends` parent. Some guard sites need
  Ruby bases that may not be ported yet (e.g. `RuntimeError`, `FrozenError`) —
  port the missing base class first (rooted per the rule's `ROOT_BASES`), then
  convert the throw.
- This is a **300 LOC story scoped to one PR** — do NOT try to clear all 173
  files at once. Pick a coherent slice (one package, or one subsystem's files),
  burn those down under the 500 LOC ceiling, and if meaningful work remains
  register a further continuation story (`pnpm tasks new
0025-fidelity-verification-tooling <slug>`) rather than fanning out PRs.

## Acceptance criteria

- [ ] A coherent slice of files is removed from
      `eslint/rails-error-parity-exclude.json`, with every `throw new
Error(...)` in them replaced by the correct ported error class (read the
      Rails source for each site to choose the right class — do not invent
      classes or pick a near-miss).
- [ ] Any Ruby base class a converted site requires but that is missing is
      ported into the appropriate `errors.ts` with the manifest-correct parent,
      and the manifest is regenerated.
- [ ] `pnpm lint` passes with the shrunken baseline (rule stays `error`); the
      baseline is strictly smaller and never grew.
- [ ] Touched packages' affected test files stay green; api:compare /
      test:compare delta non-negative.
- [ ] PR diff under the 500 LOC ceiling; remaining files (if any) registered as
      a follow-up continuation story.
