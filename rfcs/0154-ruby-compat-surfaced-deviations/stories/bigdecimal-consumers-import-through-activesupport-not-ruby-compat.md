---
title: "BigDecimal consumers import through @blazetrails/activesupport instead of ruby-compat plus the Rails require edges"
status: draft
updated: 2026-09-17
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

After trails#7853, `BigDecimal` lives in `@blazetrails/ruby-compat`, and activesupport's `core-ext/big-decimal/conversions.ts` is the port of `BigDecimalWithDefaultFormat` (the prepend making `to_s` default to `"F"`, `activesupport/lib/active_support/core_ext/big_decimal/conversions.rb`).

Every consumer outside activesupport still imports `BigDecimal` from `@blazetrails/activesupport`: `arel/src/visitors/{to-sql,dot}.ts`, `activerecord/src/connection-adapters/{abstract,postgresql,mysql,sqlite3}/quoting.ts`, `postgresql/oid/{decimal,money}.ts`, `activemodel/src/type/{decimal,immutable-string}.ts`, `activemodel/src/type/helpers/numeric.ts`, `activemodel/src/validations/numericality.ts`, `actionpack/src/action-controller/metal/strong-parameters.ts`. In Rails those files reach the stdlib constant through `require "bigdecimal"` / `bigdecimal/util`. Only some require the core_ext, e.g. `activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:3`. So in trails the prepend's load is incidental to where the class is imported from, not tied to the Rails `require` edges.

## Acceptance criteria

- Each listed consumer imports `BigDecimal` / `toD` from `@blazetrails/ruby-compat`, unless its Rails file (or a file it requires) requires `active_support/core_ext/big_decimal/conversions`. Those import the core_ext for its side effect, citing the `require` line (e.g. `abstract/quoting.rb:3`).
- Consuming packages declare the `@blazetrails/ruby-compat` dependency and tsconfig reference where they are missing.
- Behaviour is unchanged: `mysql/quoting.ts` `castBoundValue` still renders `"F"` (explicit arm), which is covered by `quoting.trails.test.ts`.
