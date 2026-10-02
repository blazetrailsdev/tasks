---
title: "arel, activerecord, actionpack, activesupport: hand-rolled class-name helpers converge onto rbObjClassname"
status: draft
updated: 2026-10-02
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Object#class` interpolated into a message is ruby-compat's `rbObjClassname`
(`rb_obj_classname`, `vendor/ruby/v3.3.11/variable.c:498`). Several ported bodies still
hand-roll it, and each answers `Number` / `Object` / `Date` where Ruby answers `Integer` /
`Hash` / `Time`:

- `packages/arel/src/visitors/to-sql.ts:36` `constructorName`, used by `UnsupportedVisitError`
  (`vendor/rails/v8.0.2/activerecord/lib/arel/visitors/to_sql.rb:6-10`,
  `"Unsupported argument type: #{object.class.name}"`).
- `packages/activerecord/src/relation/query-methods.ts:853` `rubyClassNameOf`, used at `:875`
  and `:2030`.
- Inline `value === null ? "NilClass" : value.constructor.name` at
  `packages/actionpack/src/action-dispatch/http/param-builder.ts:252`,
  `packages/actionpack/src/action-dispatch/request/session.ts:83`,
  `packages/actionview/src/template/renderable.ts:12`,
  `packages/activerecord/src/nested-attributes.ts:260`,
  `packages/activesupport/src/duration.ts:481`,
  `packages/activesupport/src/core-ext/hash/conversions.ts:57`.

## Acceptance criteria

- [ ] Each site calls `rbObjClassname` (or `rbModName(rbObjClass(x))` where Rails writes
      `.class.name`); `constructorName` and `rubyClassNameOf` are deleted.
- [ ] No new row in `eslint/no-ruby-compat-reimplementation-exclude.json`.
- [ ] `pnpm parity:api:calls:args` stays green.
