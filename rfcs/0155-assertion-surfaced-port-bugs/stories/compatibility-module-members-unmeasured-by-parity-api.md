---
title: "compatibility-module-members-unmeasured-by-parity-api"
status: ready
updated: 2026-09-30
rfc: "0155-assertion-surfaced-port-bugs"
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

Surfaced while shipping `lift-migration-compatibility-parity-exclusion`, which
brought `activerecord/lib/active_record/migration/compatibility.rb` into
`parity:api`. It scores 18/36: every member Rails defines inside a nested
`module` is reported missing:

- `LegacyIndexName` (`compatibility.rb:43-99`): `legacy_index_name`,
  `index_name_options`, `expression_column_name?`.
- the per-version `module TableDefinition` / `module CommandRecorder`
  (`compatibility.rb:101-487`): `column`, `index`, `references`, `belongs_to`,
  `timestamps`, `primary_key`, `new_column_definition`, `raise_on_if_exist_options`,
  `raise_on_duplicate_column`, `invert_transaction`, `invert_change_column_comment`,
  `invert_change_table_comment`, `change`, `index_options`,
  `compatible_timestamp_type`.

`packages/activerecord/src/migration/compatibility.ts` ports these as object
literals (`const LegacyIndexName = {...}`, `static TableDefinition = {...} as
unknown as PrependModule`) with a leading `super_` parameter for ruby-compat's
object `prepend` (`packages/ruby-compat/src/prepend.ts`). The extractor does not
see object-literal members, so their names, call sets and argument shapes are
ungated.

## Acceptance criteria

- [ ] Every `compatibility.rb` module member is credited by `parity:api`
      (converge the port onto a shape the extractor reads — a class module for
      `include()`/`prepend()` — rather than teaching the extractor object literals,
      unless no such shape expresses `class << t; prepend TableDefinition; end`).
- [ ] New call / call-args rows that surface are converged or receipted.
