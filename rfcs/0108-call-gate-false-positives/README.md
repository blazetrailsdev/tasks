---
rfc: "0108-call-gate-false-positives"
title: "Call-gate false positives — comparator reports a mismatch where the port is faithful"
status: closed
created: 2026-08-17
updated: 2026-08-18
owner: "@deanmarano"
packages:
  - "activerecord"
  - "activesupport"
  - "activemodel"
  - "actionview"
  - "arel"
clusters:
  - "api-compare"
related-rfcs:
  - "0025-fidelity-verification-tooling"
  - "0084-wide-call-set-burndown"
  - "0095-call-argument-parity"
  - "0107-relation-ts-decomposition"
priority: 3
---

## Summary

Six comparator bugs that make `parity:api:calls` / `parity:api:calls:args`
report a mismatch **where the port is already faithful**. Each one costs a
convergence story a round of analysis to conclude "nothing to do", and several
produce baseline rows that **cannot be retired by writing correct code** — the
only way to clear them is to fix the tool.

Split out of RFC 0025 (262 stories) so this work is schedulable on its own.
RFC 0025 keeps everything else and stays postponed.

## Why these six and not the rest of 0025

The scoping rule is narrow and mechanical: **a false positive in the call
gates** — the tool claims a divergence that is not there. That excludes the two
neighbouring populations, deliberately:

- **measurement holes** (a real divergence the tool cannot see) — nested-class
  methods missing from the coverage denominator, Ruby metaprogrammed members,
  Ruby hash keys scored as novel. Those stay in 0025.
- **ungated dimensions** (a real divergence nothing fails on) — arity, the
  extra-surface novel count. Also 0025.

A false positive is worse than either, because it actively blocks work: the
gate is red for a body that is correct, so the convergence PR that touched it
cannot land without baselining a row that says nothing true.

## The six

| story                                                    | est | what it falsely reports                                                                                                                                                                                      |
| -------------------------------------------------------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `precise-call-pairing-key-for-owner-static-and-accessor` | 600 | the `<package, tsFile, rubyName>` row key cannot name the member on either side — nested vs outer class, static vs instance, module vs mixin seam, reader vs writer. Merged from five separately-filed bugs. |
| `call-arg-comparator-attr-reader-false-positives`        | 200 | a Ruby `attr_reader` read counts as a 0-arg call; the TS counterpart is a getter or field, so a correct port is short one call site.                                                                         |
| `ts-extractor-records-no-calls-for-getters`              | 180 | the get-accessor branch (`extract-ts-api.ts:2118`) records no `calls`/`callSeq`/`skeleton` at all, so every method trails ports as a getter has an empty population and its dropped calls are invisible.     |
| `closure-resolves-property-reads-as-same-file-methods`   | 120 | a receiver-blind property read (`details.locale`) resolves against a same-file method named `locale` and unions its call set, so editing an unrelated method changes this body's `missing` set.              |
| `extractor-object-literal-keys-are-not-ported-methods`   | 120 | an object-literal key whose value is a function counts as a ported member, so one Hash with a `raise:` key turned **67 unrelated activesupport files** red.                                                  |
| `call-order-should-follow-ruby-argument-evaluation`      | 120 | the comparator orders TS calls by source position, but Ruby evaluates interpolated arguments before the call they are passed to, so a call-for-call identical port reports an ORDER mismatch.                |

~1,340 LOC total.

## Live consumers

- **RFC 0107 `converge-relation-length-onto-records-delegation` is `blocked`**
  on `precise-call-pairing-key-for-owner-static-and-accessor`. Moving
  `Relation#length` to its faithful home in `DelegationMethods` turns three
  _other_ methods red (`apply_join_dependency`, `create_or_find_by`, `to_sql`
  against `with_connection`) because call credit leaks between siblings in a
  class body. That story unblocks when this one lands.
- `activerecord/persistence.json`'s `_update_record | attributes_for_update`
  row is un-retirable today: PR #6430 made the instance body call exactly what
  `persistence.rb:901` calls and the row did not go stale, because the gate is
  reading the `ClassMethods` body.
- `packages/activesupport/src/deprecation.ts:49` still spells
  `DEFAULT_BEHAVIORS` as a `ReadonlyMap` rather than the object literal the Ruby
  Hash maps to — a deviation carried purely to dodge the object-literal-key bug.

## Done condition

Every baseline row cited in the six story bodies goes **STALE** and is deleted
by hand (only-shrink, no reseed), with `pnpm parity:api:calls:tighten` run for
the affected shards. Concretely that includes the 4 `ExplainProxy` rows in
`call-mismatches-exclude/activerecord/relation.json`, the `_update_record` row
in `persistence.json`, the mixin-seam rows in
`connection-adapters/postgresql-adapter.json` (15 today), the `transform_value`
row in `associations/association-scope.json`, and the `order:` rows that are
argument-evaluation artifacts (38 `order:` rows exist across 28 shards today —
triaging which are artifacts is part of the last story).

Plus: RFC 0107's blocked story unblocks, and `DEFAULT_BEHAVIORS` can be spelled
as the object literal it is in Ruby.

## Non-goals

- Widening any baseline. Every row this RFC touches is deleted, not re-reasoned.
- New gate dimensions. This RFC only makes existing gates stop lying.
- The rest of RFC 0025.

## Stop rule (added 2026-08-17, after the first six landed)

The first wave delivered: the exclude tree went **1,637 -> 1,407 rows (-230)**,
and three of the four named done-condition rows are gone (`persistence.json`
`_update_record | attributes_for_update`, the four `ExplainProxy` rows in
`relation.json`, `association-scope.json` `transform_value`); the PG mixin-seam
shard went 15 -> 9.

It also produced four follow-ups, one of which — `resolve-owner-by-static-and-include-graph-instead-of-skipping`
— exists because `precise-call-pairing-key-for-owner-static-and-accessor`
(PR #6659) fixed the row key in the **negative** direction only. At
`scripts/api-compare/compare.ts:2812-2813` both ambiguity checks are a bare
`return`:

```ts
if (ambiguousTsOwner(tsOwners, tsClass)) return;
if (ambiguousRubyOwner(rubyOwnersByName.get(rubyName), tsOwners)) return;
```

That converted ~107 false positives into ~107 **silently dropped comparisons**.
A dropped comparison is worse than a false positive for this RFC's purpose: a
false positive is visible and annoying, a dropped comparison is invisible and
nothing counts it.

So, for every remaining story here:

**A story may not close by suppressing a comparison.** If the tool cannot
resolve a pair, it records the pair and the row is baselined with a reviewed
reason — it is never silently skipped. `ownerRecordsNothing` is the one
sanctioned exception and it is named, counted and reported; a bare `return` is
not.

**Every PR reports the suppressed-comparison count** in its body, alongside the
row count. The row count going down while the suppressed count goes up is not
progress and will not be accepted as closing a story.

## Scope is closed

The population is the six original stories plus the four follow-ups they
produced. **No further stories are admitted to this RFC.** Anything else the
work surfaces goes to its natural owner — port convergence to
`0106-wide-call-set-direct-burndown` (which is where
`converge-accessor-surfaced-call-set-rows` and
`converge-pg-lookup-cast-type-from-column-onto-quoting-module` correctly went),
measurement holes and ungated dimensions back to
`0025-fidelity-verification-tooling`.

## CLOSING — 2026-08-18

**This RFC is closed to new stories. It is finishing only what is already in
flight, and closes when the last of those merges.**

### What it delivered

The exclude tree went **1,637 -> 1,266 rows (-371)**, the generic RFC 0047 seed
population **1,115 -> 808**, and all four named done-conditions were met:

- `persistence.json` `_update_record | attributes_for_update` — deleted
- the four `ExplainProxy` rows in `relation.json` — deleted
- `association-scope.json` `transform_value` — deleted
- `explain.json`'s empty shard — deleted

Plus the headline unblock: RFC 0107's `converge-relation-length-onto-records-delegation`
was verified unblocked end-to-end on 2026-08-17 (both ratchets OK, zero
`relation.ts` x `with_connection` rows, 61 test files green).

Coverage went up as well as noise down: comparisons 5,583 -> 5,761 pairs.

### Why it is closing rather than continuing

It grew 6 -> 10 -> 18 -> 24 stories. The work was real — nearly every story
carries a measured false positive and a PR — but the RFC had become the general
call-gate work queue rather than a bounded burndown. Three signals made that
concrete:

1. **Generational chaining.** `resolve-owner` -> `resolve-duplicate-declaration-owners`
   -> `core-receiver-calls-in-core-ext` -> `constant-and-module-eval-receivers` +
   `fully-weak-ruby-body`. Four generations, each fix revealing the next.
2. **A fix that made the tool worse.** `core-receiver-calls-in-core-ext` (#6680)
   moved the compared population 5,762 -> 5,649, losing 113 pairs by widening
   `weak`. The row count improved while coverage silently shrank — the exact
   trade the stop rule above was written against, recurring anyway.
3. **Scope drift into undeclared packages.** `chain-receiver-core-call-in-nokogiri-parse`
   (nokogiri), `request-env-by-reference` and
   `request-forgery-protection-this-typed-mixin` (actionpack) are outside this
   RFC's declared package list, and passed validation only because they declared
   `packages: []`.

The prose stop rule did not hold, and would not have: what drives filing is that
this RFC exists, is visible, and was priority 1. Priority is now 3 and the RFC
closes on the last in-flight merge.

### Where the remaining work goes

- **Call-gate false positives** -> `0025-fidelity-verification-tooling`, the
  parent backlog. `raise-class-message-pairs-with-throw-new`,
  `value-equivalent-constant-spellings` and
  `chain-receiver-core-call-in-nokogiri-parse` moved there on 2026-08-18.
- **Port convergence** (a real divergence a gate fix stopped hiding) ->
  `0106-wide-call-set-direct-burndown`.

### Known gap carried out

`precise-call-pairing-key-for-owner-static-and-accessor` merged five separately
filed bugs and closed `done` having delivered four. The fifth — a Ruby writer
pairing with the reader rather than `setX` — re-emerged as
`pair-ruby-writer-with-ts-set-accessor-not-its-reader`, which is in flight here.
When merging N stories into one, give the body a per-arm checklist so `done` is
falsifiable per arm; a merged body without one can close with an arm undelivered.

## CLOSED — 2026-08-18

All 21 stories are `done`. Nothing is in flight.

Two stories arrived after the closing note above was written and were moved out
rather than worked here, both for the reasons that note already gave:

- `converge-reset-and-commit-csrf-token-onto-this-typed-mixin` -> `0023-surfaced-deviations`.
  Port convergence (a body change), in **actionpack** — outside this RFC's
  declared packages. Split out of `request-forgery-protection-this-typed-mixin`.
- the three not-started stories -> `0025-fidelity-verification-tooling`.

That both arrivals were the same two categories the closing note predicted is
the useful signal here: the leak was structural, not a lapse of judgement by any
one agent. A live RFC named after a subsystem collects everything filed about
that subsystem, whatever its charter says. The fix is to close it, which is now
done.

**Final measures.** Exclude tree **1,637 -> 1,266 rows (-371)**. Generic RFC 0047
seed population **1,115 -> 808**. Compared pairs **5,583 -> 5,761** — coverage up
while noise fell, which was the point. All four named done-conditions met, and
RFC 0107's `converge-relation-length-onto-records-delegation` verified unblocked
end-to-end.
