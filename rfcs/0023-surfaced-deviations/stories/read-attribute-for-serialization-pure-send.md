---
title: "Converge read_attribute_for_serialization to pure send (drop store/attributes fallbacks)"
status: draft
updated: 2026-06-24
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

PR #4043 ported `read_attribute_for_serialization`
(`ActiveModel::Serialization`, `vendor/rails/activemodel/lib/active_model/serialization.rb:167`
`alias :read_attribute_for_serialization :send`). The default hook is literally
`send(key)`, and `serializable_attributes` (serialization.rb:174-175) calls it
per key. trails' `readAttributeForSerialization`
(`packages/activemodel/src/serialization.ts`) is faithful to `send` for the
common cases (value getters incl. user overrides returned, function readers
invoked on storeless hosts, present-getter-returns-undefined yields undefined,
missing reader raises) but carries two deliberate, evidence-backed divergences
that strict `send` cannot satisfy as-is:

1. **Function-valued readers on `_attributes`-backed records read the store
   instead of being invoked.** This exists because `attribute("toJSON")` cannot
   install a getter (`toJSON` is structurally reserved by `JSON.stringify`), so
   `this["toJSON"]` resolves to `Model#toJSON`; invoking it recurses infinitely
   (serializableHash → readAttributeForSerialization → toJSON → asJson →
   serializableHash …). Pinned by the existing
   `attribute named toJSON does not shadow Model#toJSON` test
   (`serialization.test.ts`). In real Rails, `attribute :to_json` wouldn't
   define the reader either and `send(:to_json)` would call the method — so
   strict send isn't raw-value-faithful there; the store read is the sane JS
   equivalent. A method-named declared attribute whose reader is a genuine
   user-defined method (not the framework `toJSON`) is the narrow case the
   reviewer flags that this store read does not serve.

2. **`attributes`-hash fallback when no per-key reader exists.** trails'
   `ActiveModel::Serializers::JSON` host contract surfaces values through the
   `attributes` getter with no per-key readers — the `attributes`-getter
   pattern pinned by 6 model classes across ~10 tests in
   `serializers/json.test.ts`. Removing the fallback makes exactly those tests
   raise `NoMethodError`. A Rails JSON host would define `attr_accessor` /
   generated readers and thus never hit this tier; no real Rails-shaped model
   reaches it (Model/AR records are `_attributes`-backed or carry readers).

Both are confined to trails-specific host shapes with no Rails-model
equivalent, so they introduce zero divergence for actual Rails-model
serialization. Converging to pure `send` requires either solving the toJSON
recursion structurally (so method-named attributes can be invoked safely) or
migrating the JSON-host test models to define per-key readers (matching Rails'
`attr_accessor` requirement) and then dropping the `attributes`/`readAttribute`
fallback so a reader-less key raises.

Surfaced by Codex review on PR #4043 (rounds 4-6).

## Acceptance criteria

- `readAttributeForSerialization` dispatches `send(key)` for every key,
  including invoking a user-defined method reader on an `_attributes`-backed
  record, without infinitely recursing on a `toJSON`-named attribute (solve the
  JSON.stringify reservation structurally, e.g. distinguish the framework
  `toJSON` from a user method, or rename/guard the serialization re-entry).
- The `attributes`/`readAttribute` value fallback is removed so a storeless
  host with `attributes: { name: "x" }` and no `name` reader raises
  `NoMethodError` like Ruby `send(:name)`; the `serializers/json.test.ts` host
  models are migrated to expose per-key readers (Rails `attr_accessor` parity)
  in the same change.
- The `attribute named toJSON does not shadow Model#toJSON` behavior is
  preserved or its expectation is explicitly re-derived from Rails and updated.
- No regression in activemodel / AR serialization suites; api:compare stays 100%.
