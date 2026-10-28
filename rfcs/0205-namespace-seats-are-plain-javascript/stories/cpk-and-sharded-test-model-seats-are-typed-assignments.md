---
title: "cpk-and-sharded-test-model-seats-are-typed-assignments"
status: draft
updated: 2026-10-28
rfc: "0205-namespace-seats-are-plain-javascript"
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
