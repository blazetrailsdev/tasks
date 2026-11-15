---
title: "cpk-and-sharded-test-model-seats-are-typed-assignments"
status: blocked
updated: 2026-11-15
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps:
  - class-path-table-covers-activerecord-test-models
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-15T14:29:45Z"
assignee: "cpk-and-sharded-test-model-seats-are-typed-assignments"
blocked-by: "No non-constSet path source exists for test models: scripts/api-compare/class-paths.ts excludes test-only files from every table (testProjectFiles), registerConstant is retired (RFC 0213), and hand-written defineConstants is forbidden. Needs a class-paths story that emits a table for packages/activerecord/test/models (208 files seat via constSet today), then this converges."
closed-reason: null
---

## Context

`sweep-activerecord-adapter-and-association-seats` left the test-model namespaces alone:
`packages/activerecord/src/test-helpers/models/cpk.ts` (28 `rbModConstSet(Cpk, "X", this)` seats) and
`packages/activerecord/src/test-helpers/models/sharded/*.ts` (`rbModConstSet(Sharded, ...)`, `Sharded` shared
across files through `registeredConstant("Sharded")`). Mirrors Rails' `vendor/rails/v8.0.2/activerecord/test/models/cpk/*.rb`
and `sharded/*.rb`, where `class Cpk::Book` is a plain nested class.

These seats are what names the class: `rbModConstSet` writes the classpath that `rbModName` answers
(`Cpk::Book`), and test models are not in `class-paths.generated.ts`. A plain `Cpk.Book = this` loses
the name (polymorphic `_type` values, `className: "Cpk::Order"` resolution). `Cpk = {}` is also untyped,
so a plain assignment does not type-check.

## Acceptance criteria

- [ ] `Cpk` and `Sharded` are typed namespace objects; each seat is a plain assignment type-checked against a declared property.
- [ ] `rbModName` answers `Cpk::X` / `Sharded::X` for every model, from a source other than `rbModConstSet` (e.g. a generated table entry or `registerConstant`).
- [ ] No `rbModConstSet` import remains in those files.
- [ ] The CPK and sharded association tests pass.
