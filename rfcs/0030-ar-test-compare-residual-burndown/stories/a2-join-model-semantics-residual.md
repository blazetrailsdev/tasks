---
title: "a2-join-model-semantics-residual"
status: draft
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
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

Follow-up to `a2-join-model-semantics` (RFC 0030). That story un-skipped 11 of
the 35 `it.skip` join-model tests in
`packages/activerecord/src/associations/join-model.test.ts` — the ones cleanly
implementable with the existing synthetic helper API (`loadHasMany`,
`loadHasManyThrough`, `association` proxy `push`/`size`/`sum`/`maximum`,
`includes` preload). Splitting the remaining work off keeps each PR under the
LOC ceiling (single test file, can't split across PRs).

The remaining **24** tests need features the current helpers/source don't yet
cover (STI through + `base_class`, piggyback `select`, polymorphic custom PK,
counter caches, abstract-parent eager loading, `pluralize_table_names: false`,
eager-load configuration-error messages, string joins, record-exists `include?`
without loading). Some require source changes in `associations/` or
`preloader.ts`, not just a test body.

Rails ref: `vendor/rails/activerecord/test/cases/associations/join_model_test.rb`.

### Skipped tests still to un-skip (24)

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
- has many going through polymorphic join model with custom primary key
- has many through with custom primary key on belongs to source
- has many through with custom primary key on has many source
- belongs to polymorphic with counter cache
- eager load has many through has many with conditions
- eager belongs to and has one not singularized
- add to join table with no id
- has many through collection size uses counter cache if it exists
- has many through include checks if record exists if target not loaded
- has many with pluralize table names false
- proper error message for eager load and includes association errors
- eager association with scope with string joins

## Acceptance criteria

- [ ] Each remaining test above is un-skipped and passes against the canonical
      SQLite adapter (and PG/MySQL where the ruby gate applies), implementing any
      required source support in `associations/` or `preloader.ts`.
- [ ] Any test that genuinely cannot converge is reclassified to a permanent-skip
      with a recorded reason per the RFC Deferred table (not left as a bare
      feature-gap `it.skip`).
- [ ] No new gate-mismatches for `join-model.test.ts`.
- [ ] Refresh the RFC snapshot count after merge.
      </content>
