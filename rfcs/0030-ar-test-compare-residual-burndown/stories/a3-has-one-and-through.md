---
title: "A3 — has_one + has_one_through residuals"
status: claimed
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "associations"
deps: []
deps-rfc: []
est-loc: 230
priority: null
pr: null
claim: "2026-06-15T20:20:26Z"
assignee: "a3-has-one-and-through"
blocked-by: null
---

## Context

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). has-one / has-one-through loader gaps (disable_joins variant + base through).

**29** `it.skip` tests to un-skip across 3 file(s) (deduped; permanent-skips — Marshal/YAML/thread/fork/Rational — excluded). For reference, `test:compare` reports **29** `matchedSkipped` for these files (snapshot 2026-06-15); any delta is permanent/​gated skips not on the un-skip list.

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

- associations/has-one-associations.ts or preloader.ts missing has-one semantics
- associations/has-one-through-disable-joins-associations.ts or preloader.ts missing has-one-through semantics

### Skipped tests to un-skip

- `associations/has_one_associations_test.rb` → `associations/has-one-associations.test.ts` — **22** to un-skip:
  - restrict with error with locale
  - build and create should not happen within scope
  - create with inexistent foreign key failing
  - reload association with query cache
  - finding with interpolated condition
  - has one proxy should not respond to private methods
  - has one proxy should respond to private methods via send
  - creation failure replaces existing without dependent option
  - creation failure replaces existing with dependent option
  - replacement failure due to existing record should raise error
  - replacement failure due to new record should raise error
  - association keys bypass attribute protection
  - association protect foreign key
  - has one autosave with primary key manually set
  - with polymorphic has one with custom columns name
  - polymorphic has one with touch option on create wont cache association so fetching after transaction commit works
  - polymorphic has one with touch option on update will touch record by fetching from database if needed
  - has one with touch option on touch
  - has one with touch option on empty update
  - association enum works properly
  - association enum works properly with nested join
  - has one with touch option on nonpersisted built associations doesnt update parent
- `associations/has_one_through_disable_joins_associations_test.rb` → `associations/has-one-through-disable-joins-associations.test.ts` — **5** to un-skip:
  - counting on disable joins through
  - nil on disable joins through
  - preload on disable joins through
  - has one through with belongs to on disable joins
  - disable joins through with enum type
- `associations/has_one_through_associations_test.rb` → `associations/has-one-through-associations.test.ts` — **2** to un-skip:
  - has one through proxy should not respond to private methods
  - has one through proxy should respond to private methods via send

## Acceptance criteria

- [ ] Every test listed above is un-skipped (`it.skip` → `it`) and passes against the canonical SQLite adapter (and PG/MySQL where the ruby gate applies).
- [ ] `pnpm test:compare --package activerecord` shows these files with no `it.skip`-based `matchedSkipped` (any residual reclassified to a permanent-skip with a recorded reason per the RFC Deferred table).
- [ ] No new gate-mismatches introduced for these files.
- [ ] Refresh the RFC snapshot count after merge.
