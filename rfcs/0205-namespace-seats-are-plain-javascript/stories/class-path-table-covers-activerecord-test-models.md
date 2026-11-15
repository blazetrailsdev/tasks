---
title: "Class-path table covers activerecord test models"
status: draft
updated: 2026-11-15
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/test/models/**` (208 files, e.g. `cpk.ts`, `sharded/*.ts`, `admin.ts`) name their classes only through `constSet(Owner, "Name", this)`. Rails' test models are plain nested classes (`vendor/rails/v8.0.2/activerecord/test/models/cpk/book.rb`: `module Cpk; class Book < ActiveRecord::Base`), with no `const_set`. `scripts/api-compare/class-paths.ts` leaves test-only files out of every table (`testProjectFiles`, `SKIPPED` holds `activerecord-test-support`), `registerConstant` is retired (RFC 0213), and hand-written `defineConstants` is forbidden. So nothing but the seat can give `rbModName` `Cpk::Book`, which polymorphic `_type` values and `className: "Cpk::Order"` resolution need. This blocks `cpk-and-sharded-test-model-seats-are-typed-assignments`.

## Acceptance criteria

- [ ] `pnpm parity:class-paths` emits a constant table for `packages/activerecord/test/models`, deriving each class path from the test-model file layout that mirrors `vendor/rails/v8.0.2/activerecord/test/models/`.
- [ ] The test support entry imports that table, so `rbModName(CpkBook)` answers `Cpk::Book` with no `constSet` seat.
- [ ] `parity:class-paths:check` covers the new table.
