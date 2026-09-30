---
title: "activerecord: score fixtures.rb — FixtureSet, Fixture and FixtureSet::File are ported but unmeasured"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: excluded-files
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The unported register excludes `/fixtures.rb` wholesale ("Rails-specific YAML fixtures … loaded once into
the DB"), and `eslint/rails-error-parity-unported.json` lists `FixtureError` / `FormatError` as
unported for the same reason. Yet trails ports the subsystem: `packages/activerecord/src/fixtures.ts`,
`fixture-set/`, `test-fixtures.ts`, and the canonical fixtures under `test-helpers/fixtures/`.
`vendor/rails/v8.0.2/activerecord/lib/active_record/fixtures.rb` defines `FixtureSet` (≈60 methods), `Fixture`, `FixtureClassNotFound`, `FixtureError`,
`FormatError` — none of which `parity:api` scores, so their call sets and argument shapes are ungated.

`SCOPED_SKIP_GROUPS[15]` (`Fixture#initialize` under `EncryptedFixtures`' prepend) is its own story,
`activerecord-fixture-initialize-prepend-constructor`.

## Acceptance criteria

- [ ] The `/fixtures.rb` exclusion is removed; `parity:api` reports `fixtures.rb → fixtures.ts` with a measured score.
- [ ] Every missing member is ported, or — when the measured gap exceeds this story — filed as its own story in this RFC (grouped by `FixtureSet` class/instance methods) with the Rails `file:line`.
- [ ] `FixtureError` / `FormatError` leave `rails-error-parity-unported.json` and are ported with Rails' hierarchy.
- [ ] Surfaced call/args rows are converged or filed; none are baselined.

## Verification

```bash
pnpm build && pnpm parity:api && pnpm parity:skips:stories && pnpm parity:api:calls
```
