---
title: "port-actionview-polymorphic-routes-test-part-1"
status: claimed
updated: 2026-10-14
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-10-14T15:29:18Z"
assignee: "path-redirect-holds-its-template-string-as-block"
blocked-by: null
closed-reason: null
---

## Context

Split from `port-actionview-polymorphic-routes-test` (it did not fit one PR
beside `mapper-resources-resource-class-carries-param-and-as`).
`vendor/rails/v8.0.2/actionview/test/activerecord/polymorphic_routes_test.rb`
has no trails port; `packages/actionview/src/activerecord/polymorphic-routes.test.ts`
does not exist. The sibling `activerecord/controller-runtime.test.ts` shows the
actionview AR-test setup (`../test-helpers/active-record-unit.js`, `Project`
fixture).

This part ports the harness and the first half of `PolymorphicRoutesTest`:

- the `projects`-table models `Task`/`Step`/`Bid`/`Tax`/`Fax`/`Series`,
  `ModelDelegator`/`ModelDelegate`, `Weblog::Post`/`Weblog::Blog` (`:6-62`);
- `PolymorphicRoutesTest`'s `Routes`, `setup`, `assert_url` (`:64-91`) and the
  `with_*_routes` helpers (`:637-735`);
- `test_string` (`:93`) through `test_with_nested_class` (`:366-371`).

`assert_url` must be overridable so `PolymorphicPathRoutesTest` (`:737-748`)
can rerun every test (see the part-2 story).

## Acceptance criteria

- [ ] Harness and tests `:93-371` ported, names verbatim, in
      `packages/actionview/src/activerecord/polymorphic-routes.test.ts`.
- [ ] `pnpm parity:test --package actionview` credits them.
