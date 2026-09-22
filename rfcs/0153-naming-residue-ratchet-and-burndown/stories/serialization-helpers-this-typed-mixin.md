---
title: "Converge ActiveModel::Serialization helpers to this-typed mixin functions"
status: draft
updated: 2026-09-22
rfc: "0153-naming-residue-ratchet-and-burndown"
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

Rails `ActiveModel::Serialization` is a module mixed into the record
(`activemodel/lib/active_model/serialization.rb:125-201`). Its private helpers
are instance methods on `self`: `serializable_attributes` (`:170`),
`serializable_add_includes` (`:185`), `read_attribute_for_serialization`
(alias, `:163`), and `attribute_names_for_serialization` (`:165`).

trails#7956 converted `serializableHash` to a `this`-typed function on
`Serialization.prototype`. The helpers in `packages/activemodel/src/serialization.ts`
still take the record as their first argument (`serializableAttributes(this, …)`,
`serializableAddIncludes(this, …)`, `attributeNamesForSerialization(this)`,
`readAttributeForSerialization(record, key)`). `serializers/json.ts` and the
`Serialization` class wrap them with `(this as unknown as SerializationRecord, …)`.

## Acceptance criteria

- [ ] Each helper is a `this`-typed function (§ "Module mixins"), called as a
      `this.x(...)` / `x.call(this, ...)` self-call like Rails.
- [ ] The `Serialization` / `JSON` wrapper methods are prototype assignments, not
      host-passing wrappers.
- [ ] `pnpm parity:api:calls`, `:calls:args` and `:params` are green.
