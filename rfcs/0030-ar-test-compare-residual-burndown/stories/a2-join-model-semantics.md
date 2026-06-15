---
title: "A2 — join_model: has_many :through join-model semantics"
status: in-progress
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "associations"
deps: []
deps-rfc: []
est-loc: 280
priority: null
pr: 3405
claim: "2026-06-15T20:15:24Z"
assignee: "a2-join-model-semantics"
blocked-by: null
---

## Context

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). `associations/join-model.ts` / `preloader.ts` miss join-model (HMT) semantics.

**35** `it.skip` tests to un-skip across 1 file(s) (deduped; permanent-skips — Marshal/YAML/thread/fork/Rational — excluded). For reference, `test:compare` reports **35** `matchedSkipped` for these files (snapshot 2026-06-15); any delta is permanent/​gated skips not on the un-skip list.

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

- associations/join-model.ts or preloader.ts missing join-model semantics

### Skipped tests to un-skip

- `associations/join_model_test.rb` → `associations/join-model.test.ts` — **35** to un-skip:
  - polymorphic has many going through join model with find
  - polymorphic has many going through join model with include on source reflection
  - polymorphic has many going through join model with include on source reflection with find
  - polymorphic has many going through join model with custom select and joins
  - polymorphic has many going through join model with custom foreign key
  - polymorphic has many create model with inheritance and custom base class
  - polymorphic has many going through join model with inheritance
  - polymorphic has many going through join model with inheritance with custom class name
  - polymorphic has many create model with inheritance
  - polymorphic has one create model with inheritance
  - has many with piggyback
  - create through has many with piggyback
  - include polymorphic has one defined in abstract parent
  - include polymorphic has many through
  - has many going through polymorphic join model with custom primary key
  - has many through with custom primary key on belongs to source
  - has many through with custom primary key on has many source
  - belongs to polymorphic with counter cache
  - has many polymorphic associations merges through scope
  - eager load has many through has many with conditions
  - eager belongs to and has one not singularized
  - associating unsaved records with has many through
  - add to join table with no id
  - has many through collection size doesnt load target if not loaded
  - has many through collection size uses counter cache if it exists
  - adding junk to has many through should raise type mismatch
  - adding to has many through should return self
  - has many through sum uses calculations
  - calculations on has many through should disambiguate fields
  - calculations on has many through should not disambiguate fields unless necessary
  - preload polymorphic has many through
  - has many through include checks if record exists if target not loaded
  - has many with pluralize table names false
  - proper error message for eager load and includes association errors
  - eager association with scope with string joins

## Acceptance criteria

- [ ] Every test listed above is un-skipped (`it.skip` → `it`) and passes against the canonical SQLite adapter (and PG/MySQL where the ruby gate applies).
- [ ] `pnpm test:compare --package activerecord` shows these files with no `it.skip`-based `matchedSkipped` (any residual reclassified to a permanent-skip with a recorded reason per the RFC Deferred table).
- [ ] No new gate-mismatches introduced for these files.
- [ ] Refresh the RFC snapshot count after merge.
