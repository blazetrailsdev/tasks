---
title: "activemodel: railtie_test.rb's 5 cases are credited (0/5 today)"
status: ready
updated: 2026-09-30
rfc: "0173-activemodel-parity-100"
cluster: tests
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test --package activemodel` reports `railtie_test.rb → trailtie.test.ts 0/5 ✗` and
**55/56 files**. The five cases (`vendor/rails/v8.0.2/activemodel/test/cases/railtie_test.rb`) — "secure password min_cost is false in the
development environment", "… is true in the test environment", "i18n customize full message defaults to
false", "… can be disabled", "… can be enabled" — are about ActiveModel::Railtie, which trails
implements in trailties (`packages/trailties/src/trailties/active-model.ts`, with
`active-model.test.ts` beside it). The convention path the comparison expects is
`packages/activemodel/src/trailtie.test.ts`.

## Acceptance criteria

- [ ] The five cases are ported (or moved) under Rails' names and credited by `parity:test` — via a `scripts/test-compare` file mapping for `activemodel/test/cases/railtie_test.rb` → the trailties test file if that is where the railtie lives, never by renaming the tests.
- [ ] `pnpm parity:test` activemodel **56/56 files** and 1012/1020 before the skipped cases.

## Verification

```bash
pnpm parity:test --package activemodel --missing && pnpm parity:test:assertions
```
