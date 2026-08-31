---
title: "Enroll rack-session in parity:api and parity:test so the port is measured from its first line"
status: draft
updated: 2026-08-31
rfc: "0133-rack-session-gem-port"
cluster: null
packages: [rack-session]
deps: [rack-session-package-skeleton]
deps-rfc: []
est-loc: 200
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Story 3. The point of vendoring the gem rather than hand-rolling it is that
both fidelity measures start working; this story turns them on, before any body
moves, so the relocation lands against a live measure and the honest baseline
(100% missing) is on record.

Registrations, each verified against the file as it stands:

- `scripts/api-compare/config.ts:188` — `PACKAGES` already lists `rack`; add
  `rack-session`. Add it to `MANIFEST_PACKAGES` (`:177-192`) too: that list's
  own docstring says a package is projectable exactly when the Ruby extractor
  runs over its vendored source, i.e. `compareApi !== false`, which is the case
  here. Do **not** add it to `PACKAGES_OUTSIDE_MANIFEST`.
- `scripts/test-compare/compare.ts:1472` — `pkgDirs` gains
  `"rack-session": "packages/rack-session/src/"`.
- `scripts/test-compare/compare.ts:127-133` — `rubyToConventionTs`'s
  `pkg === "rack"` branch strips a `spec_` prefix and kebab-cases the rest.
  rack-session's suite is exactly that shape (`spec_session_pool.rb` →
  `session-pool.test.ts`), so widen the condition rather than writing a second
  branch. Decide and record whether the leading `session_` segment is also
  stripped (the gem's lib root is already `lib/rack/session`, so
  `spec_session_pool.rb` mirrors `src/pool.ts` → `pool.test.ts`); the i18n
  branch immediately below is the precedent for dropping a redundant leading
  segment.
- `scripts/api-compare/extra-surface-mark.json` — **not** touched.
  `rack-session` does not join `GATED_PACKAGES`; that is a separate reviewed
  burndown (CLAUDE.md), and this package is measured/reported like `globalid`
  and `i18n`.

Expected measurements once enrolled (both verified by running the extractors
against a `v2.1.0` clone): `rack-session: 19 classes, 3 modules, 78 public
methods (46 internal)` on the api side, `7 files, 124 tests` on the test side —
all missing until the port stories land.

Hazard: `MANIFEST_PACKAGES` feeds `scripts/build-rails-privates-manifest.ts`,
so `blazetrails/rails-private-jsdoc` will start demanding `@internal` on the
gem's 46 private members. It is autofixable; run `pnpm lint --fix` in this
story while the package is still nearly empty rather than leaving it for a port
story. This is RFC open question 2.

## Acceptance criteria

- `pnpm parity:api` prints a `rack-session` row; `pnpm parity:test` prints
  `rack-session: 7 files, 124 tests` on the Ruby side.
- The `spec_`-prefix path mapping is covered by a test in
  `scripts/test-compare/` alongside the existing `rack` cases, and the
  `session_`-segment decision is recorded in a comment at the branch.
- `pnpm parity:api:extra --package rack-session` runs and reports; the package
  is absent from `GATED_PACKAGES` and `extra-surface-mark.json` is unchanged.
- `pnpm lint` clean, including `rails-private-jsdoc` over the new package.
- Deltas for every other package are non-negative.
