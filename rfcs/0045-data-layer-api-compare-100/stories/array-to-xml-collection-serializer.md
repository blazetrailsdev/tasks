---
title: "array-to-xml-collection-serializer"
status: ready
updated: 2026-06-29
rfc: "0045-data-layer-api-compare-100"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`ActiveRecord::Delegation` delegates `to_xml` to `records`
(`relation/delegation.rb:101`), i.e. `Array#to_xml`
(`active_support/core_ext/array/conversions.rb`). Every other
`delegate ... to: :records` / `to: :model` name now resolves as a real method
on `Relation` via `DelegationMethods`
(`packages/activerecord/src/relation/delegation.ts`), landed by story
`relation-delegation-rails-named-methods`. `to_xml` is the one holdout: it is a
bespoke collection XML serializer (root element derived from the model name,
per-record `<post>` wrapping, type attributes) distinct from a single record's
`toXml` (`packages/activemodel/src/model.ts:2155`), and ActiveSupport's
`Array#to_xml` is itself not yet ported. It is currently a per-name scoped skip
in `scripts/api-compare/conventions.ts` (`SCOPED_SKIP_GROUPS`, names: `["to_xml"]`,
rubyFiles: `relation.rb` + `relation/delegation.rb`).

## Acceptance criteria

- Port `Array#to_xml` (ActiveSupport) and expose `relation.toXml(...)` as a real
  method on `Relation` mirroring Rails' collection serialization (root element,
  per-record element name, `type="array"`, builder options like `root:`,
  `skip_types:`, `:only`/`:except`).
- Remove the `to_xml` entry from `SCOPED_SKIP_GROUPS`; relation.rb /
  relation/delegation.rb stay at 100% api:compare; no test:compare regression.
- Test names match Rails verbatim.
