---
title: "has_many_associations_test assertion parity: land WIP branch + remaining rows"
status: in-progress
updated: 2026-09-22
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 600
priority: 3
pr: trails#7973
claim: "2026-09-22T16:42:42Z"
assignee: "assertions-has-many-associations-remainder-11"
blocked-by: null
closed-reason: null
---

## Context

Tenth slice of `assertions-has-many-associations-remainder`. #7964 converged 11 rows of `packages/activerecord/src/associations/has-many-associations.test.ts`.

**Start from branch `has-many-assertions-remainder-11-wip` (commit a80552b26c).** It was written after #7964 was already open and never merged. Rebase it onto main: it adds 22 more Rails-faithful ports, each passing locally, and one parked test:

- counter cache: sharded deleting models (rb:1306), has many without counter cache option (rb:1331), deleting updates counter cache with dependent delete all / destroy (rb:1455/1464), calling update changing ids of inversed association (rb:1519), overlapping counter cache columns (rb:1405), updates counter cache when default scope is given (rb:2872). These use `assertDifference` / `assertNoDifference`.
- abstract class with polymorphic has many (rb:2607), association attributes are available to after initialize (rb:2654), first_or_create / first_or_create! (rb:2727/2738), delete_all when not loaded (rb:2749, moved into the posts-fixture describe), natural primary keys (rb:2814), unscopes default scope with include (rb:2851), RecordNotDestroyed when replaced child can't be destroyed (rb:2860)
- autosaves when already persisted (rb:2909), replace in memory with same id (rb:2924), prevent double firing before save (rb:3024), ids reader memoization (rb:3130), loading association in validate callback (rb:3143), in memory replacements do not execute callbacks (rb:2950), reattach to new objects (rb:2983)
- parked: create children could be rolled back by after save (rb:3154), BLOCKED on `0155-assertion-surfaced-port-bugs/after-rollback-on-create-skipped-for-rollback-raised-in-after-save`

Measure: `pnpm parity:test -- --package activerecord --assertions --missing | grep has_many_associations_test`.

Still unported after the branch:

- calling none/one/many should defer to collection if using a block (rb:2377/2417/2461): port `assert_not_called(firm.clients, :size)` with `assertNotCalled` from `activesupport/src/testing/method-call-assertions.ts`.
- async load has many (rb:3262): Notifications-subscribed event count plus the `payload[:async]` check.
- collection proxy respects default scope (rb:2773): make it `toBeFalsy`.
- passes custom context validation (rb:2890).
- destroy does not raise / destroy with bang bubbles errors (rb:3114/3122): use a canonical `AuthorWithErrorDestroyingAssociation` / `PostWithErrorDestroying` model (test/models/author.rb) instead of the bespoke classes.
- restrict with error with locale (rb:2004), calling empty rows (rb:3068-3096), key-validation rows, composite primary key malformed association (instanceOf → assert_raises), find one message on primary key, create, has many association with same foreign key name, get ids for new record, adding array and collection, three levels of dependence, deleting self type mismatch, deleting by integer id, dependence.

Known blockers: rb:2506 transaction proxy; rb:1764 (`has-many-delete-nullify-out-of-scope`); multi-extension (`collection-proxy-extend-super-chain`).

## Acceptance criteria

- The WIP branch's ports land on main (rebased, green on all adapters).
- 0 assertion count/kind/value mismatches for the file, or a converged slice plus a re-filed remainder. Parked tests use `it.skip` with a `BLOCKED:` line.
