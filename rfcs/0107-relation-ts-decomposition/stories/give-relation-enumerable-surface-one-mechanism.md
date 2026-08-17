---
title: "Give Relation's Enumerable surface one mechanism instead of three @noRailsEquivalent tags"
status: done
updated: 2026-08-17
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6639
claim: "2026-08-17T10:01:56Z"
assignee: "assertions-activemodel-remainder-second-pass"
blocked-by: null
closed-reason: null
---

## Context

Rails' `Relation` gets `detect`, `sort_by`, `group_by`, `index_by`,
`compact_blank`, `reject`, `min_by`, `each_with_object` and the rest from
`include Enumerable`
(`vendor/rails/activerecord/lib/active_record/relation.rb:67`), which works over
`each` → `records`. Ruby's core Enumerable has no `def` in any vendored gem, so
`pnpm parity:api:extra` reads every one of them as novel TS surface.

PR #6622 resolved the members RFC 0107's coverage pass listed, but three of them
still hand-carry the gap: `detect`, `sortBy` and `groupBy`
(`packages/activerecord/src/relation.ts`) each ship a small bespoke body plus a
`@noRailsEquivalent PERMANENT` tag citing `relation.rb:67`. `reject` and
`length` in the same file are the same shape without the tag. The tag is a
receipt, not absolution — three receipts for one missing mechanism is the smell.

The `to: :records` half of the surface already HAS its mechanism:
`RECORD_DELEGATES` + `DelegationMethods` in
`packages/activerecord/src/relation/delegation.ts` mirror
`vendor/rails/activerecord/lib/active_record/relation/delegation.rb:99-102`'s
`delegate ... to: :records` list, and `delegateRecordMethodSync` gives a loaded
CollectionProxy the synchronous path. Enumerable has no counterpart.

## Converged shape

Give the Enumerable half one mechanism the way the delegation half has one: a
single table of the Ruby Enumerable methods a Relation answers, each backed by
the activesupport free function where one exists
(`groupBy` / `indexBy` / `compactBlank` in
`packages/activesupport/src/enumerable-utils.ts`) and by a body over
`await this.toArray()` where it does not, installed onto `Relation` the way
`DelegationMethods` is. Then:

- the bespoke `detect` / `sortBy` / `groupBy` / `reject` bodies in `relation.ts`
  disappear, along with their `@noRailsEquivalent` tags;
- `CollectionProxy`'s `detect` / `sortBy` overrides
  (`packages/activerecord/src/associations/collection-proxy.ts:418-440`) either
  fold into the same mechanism or keep only the load-through-`loadTarget`
  difference `collection_proxy.rb:1024` actually has;
- the extra-surface count for `relation.ts` drops by the tagged names rather
  than carrying them as documented debt.

Scope check before sizing: decide whether the table lives beside
`RECORD_DELEGATES` (same file, adjacent mechanism) or in its own module, and
whether `parity:api`'s conventions need an Enumerable-source entry so the names
stop reading as novel at all — the latter is what actually retires the tags.

## Acceptance criteria

- [ ] One mechanism installs the Enumerable-sourced Relation methods; no
      per-method bespoke body remains in `relation.ts` for them.
- [ ] `detect`, `sortBy` and `groupBy` no longer carry `@noRailsEquivalent`.
- [ ] `pnpm parity:api:extra --package activerecord` shows `relation.ts` novel
      surface at or below its post-#6622 count of 7.
- [ ] `pnpm parity:api:calls` / `:args` green with no new rows; `relation/`,
      `collection-proxy` and association suites pass unchanged.
