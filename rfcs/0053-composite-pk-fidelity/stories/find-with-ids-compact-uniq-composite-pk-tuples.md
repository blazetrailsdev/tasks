---
title: "find_with_ids compacts + uniqs composite-PK tuple lists like Rails"
status: claimed
updated: 2026-07-02
rfc: "0053-composite-pk-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-07-02T17:21:53Z"
assignee: "find-with-ids-compact-uniq-composite-pk-tuples"
blocked-by: null
---

## Context

Follow-up surfaced while implementing `find-with-ids-compact-uniq-before-dispatch`
(PR #4116). That PR converged the **simple-PK** path to Rails'
`ids = ids.compact.uniq` before the `case ids.size` dispatch
(`activerecord/lib/active_record/relation/finder_methods.rb:504`), but
deliberately scoped out the composite-PK tuple list.

Rails applies `compact.uniq` **unconditionally** — including for composite PKs,
where `ids` is an array of tuples. So:

- `find([[1, 2], [1, 2]])` → after `uniq`, size 1 → `find_one([1, 2])` →
  returns the single record (wrapped per `expects_array`), NOT a 2-tuple
  `find_some` that raises a count mismatch.
- a literal-nil entry in the tuple list is dropped by `compact` (note: this is
  a nil _element_ of the outer list, not a nil component inside a tuple — those
  are preserved).

trails does NOT compact/uniq composite tuples:

- `packages/activerecord/src/relation/finder-methods.ts` `normalizeFindArgs`
  composite branches set `ids = args` / `ids = first` with no dedup.
- `packages/activerecord/src/core.ts` `find` composite branch builds the
  OR-of-tuples where clause from the raw tuple list.

The shared `compactUniqIds` helper added in PR #4116
(`packages/activerecord/src/relation/compact-uniq-ids.ts`) only handles scalar
ids; tuple dedup needs value-equality over the arrays (Ruby `Array#uniq` uses
`eql?`/`hash` — structural equality), so a `Set` keyed by reference will not
dedupe `[1,2]` vs `[1,2]`.

## Acceptance criteria

- [ ] Composite-PK finder paths apply Rails' `compact.uniq` to the tuple list
      before the size-based dispatch (structural tuple equality for uniq).
- [ ] `find([[1, 2], [1, 2]])` returns the single record (wrapped per
      `expects_array`); a nil outer entry is dropped.
- [ ] Tests named to match the corresponding Rails `finder_test.rb` /
      composite-PK cases (read them first).
