---
title: "Admit `first` to RECEIVER_AS_FIRST_ARG and converge the last two @missingRailsCall first tags"
status: done
updated: 2026-08-18
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6675
claim: "2026-08-17T23:07:59Z"
assignee: "admit-first-to-receiver-as-first-arg"
blocked-by: null
closed-reason: null
---

# Admit `first` to RECEIVER_AS_FIRST_ARG, then converge the last two `@missingRailsCall first` tags

## Context

Follow-up to [[ruby-first-has-no-ts-call-spelling]] (#6670), which added
`packages/activerecord/src/ruby-first.ts` and converged
`Relation#compute_cache_version` (`activerecord/lib/active_record/relation.rb:509`,
`size, timestamp = c.select_rows(arel, nil).first`).

Two `@missingRailsCall first` receipts were left in place, deliberately, because
converging them REDS the call-argument ratchet:

- `packages/activerecord/src/internal-metadata.ts` `count` —
  `activerecord/lib/active_record/internal_metadata.rb` `connection.select_values(sm, ...).first`
- `packages/activerecord/src/schema-migration.ts` `count` —
  `activerecord/lib/active_record/schema_migration.rb` same shape

Ruby's receiver is a plain local (`values.first`), so the faithful TS spelling
`first(values)` reads as Ruby `()` vs TS `(ref:values)` and the args gate
(RFC 0095) reports a `shape` row:

````text
+ activerecord  internal-metadata.ts  count  first()  (activerecord/internal-metadata.json)
+ activerecord  schema-migration.ts   count  first()  (activerecord/schema-migration.json)
```text

`compute_cache_version` escaped only incidentally — its argument is an
`await` expression, not a `ref:`, so the extractor produced no comparable row.

## Root cause

`scripts/api-compare/receiver-as-first-arg.ts` already exists for exactly this
class (RFC 0099), and its sibling `empty?` IS in the set
(`receiver-as-first-arg.ts:100`) — which is why `ruby-empty.ts`'s `isEmpty(x)`
never flagged an args row. `first` was never added, so it is the one Ruby
built-in of this shape the comparator still reads as a divergence.

`first` satisfies the table's narrow, closed admission rule verbatim: it is a
Ruby LANGUAGE built-in on Array, not a method Rails itself defines on a Rails
class, and trails necessarily exports it as a free function (`ruby-first.ts`,
the sanctioned shape from [[ruby-empty-predicate-has-no-ts-call-spelling]]).
Precedent for the edit itself is the done
[[admit-index-by-and-compact-blank-to-receiver-as-first-arg]].

## Converged shape

1. Add `"first"` to `RECEIVER_AS_FIRST_ARG` in
   `scripts/api-compare/receiver-as-first-arg.ts`, in the Ruby-built-ins block
   next to `empty?`, with the one-line citation comment its neighbours carry.
2. Import `first` from `./ruby-first.js` in `internal-metadata.ts` and
   `schema-migration.ts`; replace `values[0] as number` with
   `first(values) as number`.
3. DELETE both `@missingRailsCall first` JSDoc tags — do not reword them.
4. Confirm no OTHER call site is newly admitted by the table entry (the set is
   consulted for every `first` call in every ported body, so re-run both gates
   and read the delta rather than assuming it is two rows).

## Acceptance criteria

- [ ] `"first"` is in `RECEIVER_AS_FIRST_ARG` with its citation comment.
- [ ] `internal-metadata.ts` and `schema-migration.ts` `count` call `first(values)`;
      both `@missingRailsCall first` tags are deleted.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green with a
      LOWER row count and NO new baseline rows. No `--write` reseed.
````
