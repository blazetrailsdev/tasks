---
title: "move-ruby-inspect-and-compact-uniq-to-ruby-compat"
status: draft
updated: 2026-09-03
rfc: "0130-activerecord-extra-surface-receipt-burndown"
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

`packages/activerecord/src/relation/ruby-inspect.ts` (5 novel names:
`rubyInspect`, `rubyInspectArray`, `rubyInspectHash`, `inspectArelValue`,
`inspectOrderClause`) implements MRI `Object#inspect` / `Array#inspect` /
`Hash#inspect` formatting, and
`packages/activerecord/src/relation/compact-uniq-ids.ts` (2: `compactUniqIds`,
`compactUniqTuples`) implements `ids.flatten.compact.uniq`
(`activerecord/lib/active_record/relation/finder_methods.rb:462`) with Ruby's
value equality over bigint/number ids, which JS `Set` does not give.

Neither is ActiveRecord surface: both are Ruby core semantics, which RFC 0129
moved into `@blazetrails/ruby-compat`. They are read from nine files across
activerecord and actionpack, so they are real shared machinery in the wrong
package — `relation/` gives them a Rails file mapping they do not belong to.
After RFC 0130 phase 1 both files carry `@noRailsEquivalent CONVERGEABLE`
receipts pointing here.

`inspectArelValue` / `inspectOrderClause` are the exception: they are
Arel-aware, so they belong with `Relation#inspect`
(`relation.rb:768-781`) rather than in ruby-compat — fold them into the
`inspect` bodies that call them.

## Acceptance criteria

- `rubyInspect`, `rubyInspectArray`, `rubyInspectHash`, `compactUniqIds` and
  `compactUniqTuples` live in `@blazetrails/ruby-compat` at the Ruby names
  their core-method counterparts carry, with all call sites updated.
- `inspectArelValue` / `inspectOrderClause` fold into the ported `inspect`
  bodies, or carry the Rails name of the method they implement.
- `relation/ruby-inspect.ts` and `relation/compact-uniq-ids.ts` no longer
  exist; activerecord's `novel` mark is tightened with
  `pnpm parity:api:extra:tighten`.
