---
title: "activerecord: timestamp / integration / attribute_method? module bodies take Rails' control flow"
status: ready
updated: 2026-10-05
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails PR for `object-literal-module-members-carry-arm-skeletons` pairs a module member and a
top-level function of one name each with its own Rails body, which newly measures these activerecord
pairs in `pnpm parity:api:arms:report --package=activerecord`:

- `timestamp.ts#timestampAttributesForCreateInModel` (`:70`), `#timestampAttributesForUpdateInModel`,
  `#allTimestampAttributesInModel` (`:92`): `count +if +if` / `+if`. Rails' class methods are one
  `@x ||= (… & column_names).freeze` each
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/timestamp.rb:64-76`); the ports open with an
  own-property memo `if` and a `columnNames` guard.
- `integration.ts#toParam` (`:25`): `count +if`, `+or`. Rails is
  `return unless id; Array(id).join(self.class.param_delimiter)`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/integration.rb:57-60`).
- `integration.ts#toParam` (`:125`, `ClassMethods`): `+or +or` against
  `integration.rb:147-164`.
- `attribute-methods.ts#isAttributeMethod`: `+or` against `@attributes&.key?(attr_name)`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/attribute_methods.rb:499-501`).

## Acceptance criteria

- [ ] Each body takes Rails' control flow, arm for arm, and its row leaves the arms report.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.
