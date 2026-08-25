---
title: "port-version-compare-and-retire-gte-lt"
status: done
updated: 2026-08-04
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6094
claim: "2026-08-04T21:35:01Z"
assignee: "model-name-human-takes-options"
blocked-by: null
closed-reason: null
---

## Context

Found by the `@noRailsEquivalent` tag audit (RFC 0080).
`connection-adapters/abstract-adapter.ts:167` tags `gte` on the `Version`
class (`lt` at `:186` delegates to it and carries no tag of its own).

Rails' `AbstractAdapter::Version` (`abstract_adapter.rb:243-259`) does
`include Comparable` and defines exactly one operator, `<=>`. `>=` and `<`
come free from `Comparable`. So `gte` / `lt` are not a language gap — they
are the unported spelling of a single Ruby method.

The repo already has the mechanism: `scripts/api-compare/operator-order-spelling.ts:53`
maps `ActiveModel::Name`'s `<=>` to `compare`. Registering the same mapping
for `ActiveRecord::ConnectionAdapters::AbstractAdapter::Version` makes a
ported `compare()` match, after which `gte` / `lt` either derive from it as
`_`-prefixed helpers or disappear.

## Acceptance criteria

- Port `compare(other)` on `Version` with the dotted-part semantics of
  `abstract_adapter.rb:252`.
- Register the `<=>` to `compare` mapping for
  `ActiveRecord::ConnectionAdapters::AbstractAdapter::Version` in
  `operator-order-spelling.ts`, next to the existing `ActiveModel::Name` entry.
- Move every `gte` / `lt` caller onto `compare`, then delete both members and
  the `@noRailsEquivalent` tag.
- `pnpm parity:api:extra --package activerecord` reports no stale tags.
