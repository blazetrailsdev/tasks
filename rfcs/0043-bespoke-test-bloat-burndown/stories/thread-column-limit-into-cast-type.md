---
title: "thread-column-limit-into-cast-type"
status: claimed
updated: 2026-07-06
rfc: "0043-bespoke-test-bloat-burndown"
cluster: null
deps:
  - attributes-test-cluster
deps-rfc: []
est-loc: null
priority: 3
pr: null
claim: "2026-07-06T12:46:25Z"
assignee: "thread-column-limit-into-cast-type"
blocked-by: null
---

## Context

Rails `attributes_test.rb:384` asserts the _type object_ retains the column
limit through immutable conversion:
`assert_equal 255, OverloadedType.type_for_attribute("inferred_string").limit`.

In trails, `typeForAttribute("inferred_string").limit` returns `undefined`, not
255: `lookupCastTypeFromColumn` (adapters/.../quoting.ts:~187) builds the
StringType via `lookupCastType(sqlType)` — a bare registry lookup that does not
thread `column.limit` into the type constructor. `toImmutableString()`
(activemodel string.ts:13-19) does copy `limit: this.limit`, but the source
StringType already has `limit: undefined`, so the immutable variant does too.
trails stores limit on `_attributeDefinitions` / the reflected column
(`columnsHash().inferred_string.limit === 255`), not on the Type.

As a result PR #4104's "immutable_strings_by_default retains limit information"
test asserts against `columnsHash()` rather than the Type, which does not cover
what Rails covers (type-level limit preservation through immutable conversion).

## Acceptance criteria

- Thread `column.limit` (and precision/scale as applicable) into the cast Type
  at reflection time so `typeForAttribute(col).limit` returns the column limit,
  matching Rails `type_for_attribute(col).limit`.
- Update the "immutable_strings_by_default retains limit information" test in
  `packages/activerecord/src/attributes.test.ts` to assert
  `typeForAttribute("inferred_string").limit === 255` (the Rails assertion),
  dropping the `columnsHash()` workaround.
- No regressions in api:compare / test:compare delta.
