---
title: "relation-to-yaml-psych-dump"
status: draft
updated: 2026-09-25
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

Split out of `relations-array-to-yaml-xml`, which converged the `to_xml` half
(`Relation#toXml` now delegates to activesupport's `Array#to_xml` port, as
`delegate :to_xml, ... to: :records` does at
`vendor/rails/activerecord/lib/active_record/relation/delegation.rb:101`).

The `to_yaml` half has no trails surface to converge onto. Rails' test
(`vendor/rails/activerecord/test/cases/relations_test.rb:79-82`) calls
`Bird.all.to_yaml` and `Bird.all.to_a.to_yaml`, both of which are Psych's
`Object#to_yaml` (Psych is Ruby stdlib, not vendored). It emits through the
`encode_with` protocol: `Relation` delegates `encode_with` to `records`
(`delegation.rb:101`), and a record answers `Core#encode_with`
(`vendor/rails/activerecord/lib/active_record/core.rb:587`,
which writes `attributes`, `new_record` and `active_record_yaml_version`).
trails has no Psych emitter. `grep -rn "toYaml\|YAML.dump" packages/*/src` finds
only per-class `encodeWith` ports (`arel/src/nodes/sql-literal.ts`,
`connection-adapters/column.ts`, `schema-cache.ts`, `locking/optimistic.ts`),
and nothing that drives them.

The parked test is `it.skip("to yaml")` in
`packages/activerecord/src/relations.test.ts`.

## Acceptance criteria

- A Psych-shaped `toYaml` dumper exists (ruby-compat or activesupport, over the
  `yaml` npm dependency activesupport already has). It dispatches to
  `encodeWith(coder)` where the receiver answers it, as Psych's
  `YAMLTree#visit_Object` / `dump_coder` do.
- `Core#encode_with` is ported onto `Base` at its Rails name if it is missing.
- `it("to yaml")` in `relations.test.ts` is un-skipped with its Rails
  assertions unchanged.
