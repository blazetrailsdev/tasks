---
title: "Label every TS declaration with its naming shape"
status: draft
updated: 2026-10-26
rfc: "0000-predicate-and-underscore-naming"
cluster: naming-shape-gate
packages: ["scripts"]
deps: ["rails-api-records-class-ivars"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The RFC's shape table (`rails-underscore`, `ivar`, `private-helper`, `receipted`, `invented`, `quoted-predicate`, `q-suffix`, `snake`, `js-protocol`) is computed in `scripts/api-compare/extract-ts-api.ts`, which already records file, kind, visibility and JSDoc tags per declaration. The Ruby pairing comes from `rails-api.json`, so `_createBang` pairs with `relation.rb` `_create!`, which the audit's grep misread. Parameters and object keys are not labelled. `then` is exempt from `js-protocol` (ruled 2026-10-26). An invented `_` name is labelled `invented` even when the `_` fallback candidate would credit it (ruled 2026-10-26). A `"foo?"` pattern target or generated-name table entry (`packages/activerecord/src/attribute-methods/query.ts:21`, `attribute-methods/primary-key.ts:207`) is a `quoted-predicate` row.

## Acceptance criteria

- [ ] Each extracted declaration carries `shape`.
- [ ] Unit tests cover every shape, including the bang/predicate pairing, ivar per-class lookup and the `then` exemption.
- [ ] On AR, the counts reproduce the audit within the classifier fixes: about 79 invented public, 151 ivar public untagged, 3 quoted predicate.
