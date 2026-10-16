---
title: "parity: an explicit Ruby-constant map for the ActiveModel::Type <X>Type names replaces the fuzzy suffix transform"
status: draft
updated: 2026-10-16
rfc: "0000-activerecord-codegen-surfaced-convergence"
cluster: constant-map
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `ActiveModel::Type::String` and its siblings (`vendor/rails/v8.0.2/activemodel/lib/active_model/type/*.rb`) are exported as `StringType`, `BinaryType`, … (`packages/activemodel/src/type.ts:1-13`). The repo owner ruled on 2026-10-16 that the suffix stays because the bare names collide with JS globals, and that it needs a map.
- Today the parity tools accept it through a fuzzy transform: `TS_PARENT_ALIASES` in `scripts/api-compare/compare.ts:3170-3183` matches `` `${r}Type` `` and `` `Numeric${r}Type` `` for every Ruby class, and `scripts/api-compare/extra-surface.ts:1842,2585` reuses it. Any `FooType` is credited as any Ruby `Foo`.
- `TS_CLASS_RENAMES` (`scripts/parity/conventions.ts:78`) is the existing explicit table, but it is keyed by short name (`Registry` → `TypeRegistry`), so it cannot say `ActiveModel::Type::String` without also renaming every other `String`.
- The activerecord codegen spike needs the same table to resolve `ActiveModel::Type::Binary` (`message_pack.rb`, `type.rb`) and `include ActiveModel::Type::Helpers::Mutable` sites to the trails export.

## Acceptance criteria

- [ ] `scripts/parity/conventions.ts` exports a table keyed by fully qualified Ruby constant, with the 13 rows in the RFC (12 `ActiveModel::Type::*`, plus `ActiveRecord::ConnectionAdapters::PostgreSQL::OID::Range` → `RangeType`), each with a one-line reason.
- [ ] Before retiring the fuzzy transforms, the PR lists every pair they currently match (`parity:api` with a temporary log), and each is either a table row or already an exact name match. No pair is lost silently.
- [ ] The `` `${r}Type` `` and `` `Numeric${r}Type` `` entries are removed from `TS_PARENT_ALIASES`. `parity:api`, its inheritance check and `parity:api:extra` read the new table instead. `Numeric<X>Type` (the `applyNumericMixin` local) is handled by its own named row or by resolving the local, not by a suffix pattern.
- [ ] `docs/ruby-ts-conventions.md` shows the table, generated from `conventions.ts`.
- [ ] Unit tests in `scripts/parity/conventions.test.ts`: a row resolves, and an unrelated `FooType` no longer credits a Ruby `Foo`.

## Verification

```bash
pnpm parity:api && pnpm parity:api:extra:gate && pnpm vitest run scripts/parity/conventions.test.ts
```

Methods, inheritance and extra-surface totals for activemodel and activerecord are unchanged or better.
