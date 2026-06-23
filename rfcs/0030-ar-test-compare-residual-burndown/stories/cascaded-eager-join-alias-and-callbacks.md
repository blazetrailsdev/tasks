---
title: "cascaded-eager-join-alias-and-callbacks"
status: in-progress
updated: 2026-06-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 30
pr: 3967
claim: "2026-06-22T22:19:17Z"
assignee: "cascaded-eager-join-alias-and-callbacks"
blocked-by: null
---

## Context

Six tests in `associations/cascaded-eager-loading.test.ts` (ported from
`activerecord/test/cases/associations/cascaded_eager_loading_test.rb`) cannot be
un-skipped faithfully yet because they each hit a distinct trails feature gap.
They were investigated under story `a5-cascaded-and-sti-eager` (RFC 0030); the
other 6 tests in that file plus both `eager_load_nested_include` tests now pass.

Blocked tests and root causes:

1. `eager association loading with hmt does not table name collide when joining
associations` — `Author.joins(:posts).eager_load(:comments)` where `comments`
   is a has-many-through `:posts`. trails emits a second un-aliased `posts` join
   and raises `ambiguous column name: posts.id`. The Rails test exists precisely
   to guard against this collision; trails needs the join-dependency aliasing
   (`posts_authors`) that Rails generates.

2. `eager association loading grafts stashed associations to correct parent` —
   `Person.eager_load(primary_contact: :primary_contact)` self-join with the
   specific generated alias `primary_contacts_people_2`; trails' alias naming
   for repeated self-referential eager loads does not match.

3. `eager association loading with cascaded three levels by ping pong` —
   `Firm.all` returns all 12 companies because the canonical `Company` model
   (`test-helpers/models/company.ts`) never calls `enableSti`, so STI subclass
   scoping (`WHERE type IN (...)`) is not applied. Needs the canonical Company
   STI to be enabled (and verified not to regress the other Company importers).

4. `eager association loading with multiple stis and order` — `includes` with an
   `order` referencing eager-load aliases (`very_special_comments_posts.body`)
   requires the same alias-naming fidelity as (1)/(2).

5/6. `preloading across has one constrains loaded records` / `... has one through
   constrains loaded records` — both rely on Rails' `reset_callbacks(Model,
   :initialize)` to install a temporary `after_initialize` recorder and assert
that a `has_one` (ordered) preload instantiates exactly the constrained
record set. trails has no callback-removal / `reset_callbacks` API
(`callbacks.ts` exposes only registration), so the recorder cannot be
installed-then-removed without leaking into the shared per-worker DB.

## Acceptance criteria

- [ ] Address the join-dependency self-join aliasing gap (covers 1, 2, 4).
- [ ] Enable STI on the canonical `Company` model without regressing its other
      importers (covers 3).
- [ ] Add a `resetCallbacks` / callback-removal API (covers 5, 6).
- [ ] Un-skip the six tests in `associations/cascaded-eager-loading.test.ts` and
      make them pass against the canonical SQLite adapter using canonical models + TEST_SCHEMA + useHandlerFixtures.
