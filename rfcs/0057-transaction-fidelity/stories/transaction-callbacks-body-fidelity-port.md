---
title: "transaction-callbacks.test.ts: port SetCallback/DestroyUpdateRace/ActionCondition bodies word-for-word from Rails"
status: claimed
updated: 2026-07-07
rfc: "0057-transaction-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: 32
pr: null
claim: "2026-07-07T02:09:35Z"
assignee: "transaction-callbacks-body-fidelity-port"
blocked-by: null
---

## Context

`packages/activerecord/src/transaction-callbacks.test.ts` was converged onto the
canonical schema in PR #4179 (story `transaction-callbacks-test-canonical`,
RFC 0019). That work kept three describe blocks whose bodies were already
_simplified_ on main and do NOT port the Rails mechanics word-for-word. The test
NAMES match Rails (test:compare green) but the bodies exercise weaker behavior.

Rails: `vendor/rails/activerecord/test/cases/transaction_callbacks_test.rb`.

Deviations to converge:

1. **SetCallbackTest > "set callback with on"** (rb:1067-1086). Rails drives
   `after_commit :m1, on: :update` + `after_update_commit :m2`, then exercises
   `skip_callback(:commit, :after, :after_commit_on_update_2)` and
   `set_callback(:commit, :after, ..., on: :update)` asserting the ordered
   class-level history across create/update. trails only asserts `before_create`
   / `before_save` fire on a topics-backed local class. Needs `skip_callback` /
   `set_callback` re-registration coverage (verify trails supports these).

2. **CallbacksOnDestroyUpdateActionRaceTest** (rb:740-855). Rails uses a
   `topic_clone = find(topic.id)` + `define_singleton_method(:before_destroy_for_transaction)`
   race plus `author_name` dirty-tracking and class-variable history
   (`TopicWithCallbacksOnDestroy`/`TopicWithCallbacksOnUpdate` STI subclasses).
   trails versions are plain destroy/update with an instance log and no clone
   race — they don't actually exercise the destroy/update-after-delete race.

3. **CallbacksOnActionAndConditionTest > "callback on action with condition"**
   (rb:857-895). Rails: `after_commit(on: [:create, :update], if: :run_callback?)`
   where `run_callback?` pushes `:run_callback?` to history then returns true;
   asserts `[:run_callback?, :create_or_update]` on create+update and `[]` on
   destroy. trails uses a `beforeSave`/`approved` log instead — wrong callback
   kind and missing the if-condition-ordering assertion.

## Acceptance criteria

- [ ] Port the three describe bodies word-for-word from Rails, keeping test
      names unchanged, on the canonical `topics` table (no defineSchema).
- [ ] SetCallbackTest exercises real `skip_callback` / `set_callback`; if trails
      lacks either, file/track the impl gap before ratifying.
- [ ] Race test uses the `topic_clone` + singleton-method override + author_name
      dirty-tracking pattern.
- [ ] Condition test uses `after_commit(on:[create,update], if: run_callback?)`
      and asserts the `[:run_callback?, :create_or_update]` ordering.
- [ ] `pnpm vitest run packages/activerecord/src/transaction-callbacks.test.ts`
      passes on sqlite AND postgres; test:compare delta non-negative.
