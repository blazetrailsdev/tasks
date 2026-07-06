---
title: "serializableHash coerces scalar only/except via Array() like Rails"
status: ready
updated: 2026-07-06
rfc: "0055-serialization-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 37
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

While converging `json-serialization.test.ts` (PR #4188, RFC 0019), found that
trails' ActiveModel `serializableHash` does not accept Rails' scalar
`only:`/`except:` shape:

- trails: `packages/activemodel/src/serialization.ts:66-71` filters with
  `options.only.includes(k)` / `options.except.includes(k)`, which assumes an
  array. Passing a scalar string (`only: "name"`) would substring-match instead
  of equality-match, and a non-array would have no `.includes` for arrays of
  keys behaving as intended.
- Rails: `ActiveModel::Serialization#serializable_hash` coerces via
  `Array(options[:only]).map(&:to_s)` / `Array(options[:except]).map(&:to_s)`
  (activemodel/lib/active_model/serialization.rb), so `only: :name` (scalar
  symbol) and `only: [:name]` are equivalent.

PR #4188 worked around this only at the `ActiveSupportJSON.encode` layer
(`packages/activesupport/src/json.ts` `normalizeOptions`), so model-level
`serializableHash`/`asJson` callers still cannot pass a scalar.

## Acceptance criteria

- `serializableHash` coerces `only`/`except` with Ruby `Array(x)` semantics
  (nil -> default, scalar -> [scalar], list -> list) and stringifies entries,
  mirroring Rails `Array(...).map(&:to_s)`.
- `record.asJson({ only: "name" })` and `serializableHash({ except: "age" })`
  behave identically to the array forms.
- Widen `SerializeOptions.only`/`except` types to accept scalar.
- Add coverage; existing array-form callers unchanged.
