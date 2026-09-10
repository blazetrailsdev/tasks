---
title: "binaries-fixture-data-from-flowers-asset"
status: draft
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
closed-reason: null
---

## Context

`vendor/rails/activerecord/test/cases/fixtures_test.rb:592-598` (`test_binary_in_fixtures`)
compares `File.binread(ASSETS_ROOT + "/flowers.jpg")` to `@flowers.data` and
`@binary_helper.data`. Rails fills those columns in
`vendor/rails/activerecord/test/fixtures/binaries.yml:3` (a `!binary` literal) and
`:137` (`<%= binary(ASSETS_ROOT + "/flowers.jpg") %>`).

trails' `packages/activerecord/src/test-helpers/fixtures/binaries.ts` carries only
`{ id: 1 }` / `{ id: 2 }`, so there is no data to compare. The asset already exists at
`packages/activerecord/src/test-helpers/assets/flowers.jpg` (read with async fs by
`binary.test.ts`).

## Acceptance criteria

- `binaries.ts` supplies `data` for `flowers` and `binary_helper` equal to flowers.jpg's bytes.
- `binary in fixtures` is ported in `fixtures.test.ts` at its Rails name and its row in
  `scripts/parity/unported-files/unscoped.ts` is deleted.
