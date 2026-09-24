---
title: "as-json-dispatcher-coerces-nil-options-to-undefined"
status: draft
updated: 2026-09-24
rfc: "0156-parity-beyond-name-presence"
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

The `asJson` dispatcher (`packages/activesupport/src/core-ext/object/json.ts`,
`export function asJson`) hands a value's own `asJson` `options ?? undefined`,
where Rails' `value.as_json(options)` passes `nil` straight through
(`activesupport/lib/active_support/core_ext/object/json.rb:52-257`, every
`def as_json(options = nil)`).

The coercion exists because the model-level ports cannot take `null`:
`serializableHash(options: SerializeOptions = {}, …)`
(`packages/activemodel/src/serialization.ts`) dereferences `options.include`
unguarded, where Rails' `serializable_hash(options = nil)` returns
`serializable_attributes(attribute_names) if options.blank?`
(`activemodel/lib/active_model/serialization.rb:125-128`). Dropping the `?? undefined`
reds eight activemodel serialization tests (`TypeError: Cannot read properties
of null (reading 'include')`), measured on trails#8041.

## Acceptance criteria

- `serializableHash` declares `options: SerializeOptions | null = null` and
  takes Rails' `options.blank?` early return; `Serializers::JSON#asJson`
  (`serializers/json.rb:96-110`) and `Errors#asJson` accept `null` likewise.
- The dispatcher passes `options` unchanged to a value's own `asJson`, and the
  activemodel / activerecord serialization tests stay green.
