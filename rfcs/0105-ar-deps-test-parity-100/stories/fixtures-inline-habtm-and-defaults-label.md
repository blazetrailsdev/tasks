---
title: "fixtures-inline-habtm-and-defaults-label"
status: closed
updated: 2026-09-10
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "superseded: implemented in port-fixtures-test-cases-second-half (PR #7660) per review"
---

## Context

`FoxyFixturesTest` (`vendor/rails/activerecord/test/cases/fixtures_test.rb:1409-1427`)
has four cases excluded by `port-fixtures-test-cases-second-half`:
`supports inline habtm`, `supports inline habtm with specified id`,
`supports yaml arrays`, `strips DEFAULTS key`.

Two gaps block them:

- `vendor/rails/activerecord/test/fixtures/parrots.yml` carries inline habtm
  lists (`treasures: diamond, sapphire`, `treasures: [diamond, sapphire]`,
  `DEFAULTS: &DEFAULTS treasures: sapphire, ruby`). The TS corpus
  `packages/activerecord/src/test-helpers/fixtures/parrots.ts` dropped every
  `treasures` key, and polly's `<<: *DEAD_PARROT` / `_fixture: ignore:` too.
- Rails ignores the `DEFAULTS` label (`fixtures.rb:773`,
  `@ignored_fixtures << "DEFAULTS"`); trails' loader inserts it as a row, so
  `parrots("DEFAULTS")` resolves.

## Acceptance criteria

- [ ] `parrots.ts` mirrors `parrots.yml` including the inline `treasures` lists.
- [ ] The fixture loader ignores `DEFAULTS` (and `_fixture: ignore:` labels) as `fixtures.rb:773` does, with inline habtm rows inserted into `parrots_treasures`.
- [ ] The four cases are ported into `fixtures.test.ts` and their exclusion row is deleted from `scripts/parity/unported-files/unscoped.ts`.
