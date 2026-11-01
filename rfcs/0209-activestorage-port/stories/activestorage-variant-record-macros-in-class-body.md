---
title: "activestorage-variant-record-macros-in-class-body"
status: draft
updated: 2026-10-31
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activestorage/app/models/active_storage/variant_record.rb:4-5` declares `belongs_to :blob` and
`has_one_attached :image` in the class body. `packages/activestorage/src/variant-record.ts` runs them just after the
class, because inside a `static` block the generated class-path thunk reads the class binding in its TDZ
(`generatedClassPath`, `packages/ruby-compat/src/classpath.ts:44`), `rbModName` misses, and `_tableName` memoizes
`variant_records` instead of `active_storage_variant_records`.

## Acceptance criteria

- A macro in a `static` block computes the namespaced table name, by `generatedClassPath` retrying an unresolved entry
  and the table name not memoizing before the class path resolves.
- `VariantRecord` declares both macros in a `static` block with `this`.
