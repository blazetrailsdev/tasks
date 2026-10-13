---
title: "attribute-names-for-serialization-is-attributes-keys"
status: draft
updated: 2026-10-13
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

Rails' `attribute_names_for_serialization` is `attributes.keys` (`vendor/rails/v8.0.2/activemodel/lib/active_model/serialization.rb:157-159`).

trails' `attributeNamesForSerialization` (`packages/activemodel/src/serialization.ts`) does not call `attributes`. It probes `this._attributes` for a `keys()` method, then for a `Map`, and only then falls back to `Object.keys(this.attributes)`. The module-private `AttributeStore` type in the same file exists to serve those probes.

trails#8862 converged the sibling `readAttributeForSerialization` to `rbFSend(this, key)` (`serialization.rb:163`) and left this method as it was.

## Acceptance criteria

- [ ] The `attributeNamesForSerialization` body is `Object.keys(this.attributes)`, with no `_attributes` probing, and the `AttributeStore` type is deleted if nothing else reads it.
- [ ] ActiveRecord's override, if any, is checked against `vendor/rails/v8.0.2/activerecord/lib/active_record/serialization.rb` in the same pass.
- [ ] `serialization.test.ts`, `serialization.trails.test.ts` and activerecord's `serialization.test.ts` / `json-serialization.test.ts` pass; `pnpm parity:api:calls` is green with no baseline row added.
