---
title: "Add detect_enum_conflict! for enum accessor names (name, name=, pluralize)"
status: draft
updated: 2026-06-15
rfc: "0050-enum-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails' `_enum` runs `detect_enum_conflict!` for the enum's own accessor names
before defining the value methods:
`detect_enum_conflict!(name, name.pluralize, true)` (the `statuses` mapping
accessor), `detect_enum_conflict!(name, name)` (the reader), and
`detect_enum_conflict!(name, "#{name}=")` (the writer) —
`vendor/rails/activerecord/lib/active_record/enum.rb:231,235,236`.

Our `_enum` (`packages/activerecord/src/enum.ts`) runs the per-value
`raiseConflictError` pass (faithful to `define_enum_methods`' conflict checks)
but does **not** check these three accessor-level conflicts. This gap predates
PR #3395 (the standalone `defineEnum` did not check them either) and was carried
forward when the paths were unified.

## Acceptance criteria

- `_enum` raises the Rails `ArgumentError` ("...already defined by Active
  Record") when the enum's `pluralize(name)` accessor, the `name` reader, or the
  `name=` writer would collide with an existing method — matching
  `enum.rb:231,235,236`.
- Mirror Rails' `klass_method` flag for the pluralize check (class-method
  conflict) vs. the instance reader/writer checks.
- Add focused tests mirroring Rails' enum_test.rb conflict cases; existing enum
  tests stay green; test names match Rails verbatim.
