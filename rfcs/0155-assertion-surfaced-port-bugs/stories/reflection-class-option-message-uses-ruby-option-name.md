---
title: "Reflection 'A class was passed to' message uses Ruby option name"
status: done
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trails#8085
claim: "2026-09-25T14:11:37Z"
assignee: "time-subsec-drops-subnano-residual"
blocked-by: null
closed-reason: null
---

## Context

Rails `AssociationReflection#check_validity_of_class_name!`-adjacent guard at
`vendor/rails/activerecord/lib/active_record/reflection.rb:362` raises
``"A class was passed to `:#{option_name}` but we are expecting a string."``
with the Ruby option name (`:class_name`, `:source_type`). trails
(`packages/activerecord/src/reflection.ts:435`) interpolates the camelCased TS
option name (`:className`, `:sourceType`), so
`reflection.test.ts` "class for class name" / "class for source type" assert a
message that differs from `reflection_test.rb:520,527`.

## Acceptance criteria

- The error message matches Rails verbatim (`:class_name`, `:source_type`) —
  underscore the option name at the raise site.
- `reflection.test.ts` asserts the Rails strings.
