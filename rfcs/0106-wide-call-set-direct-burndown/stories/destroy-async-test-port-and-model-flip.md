---
title: "destroy-async-test-port-and-model-flip"
status: draft
updated: 2026-08-20
rfc: "0106-wide-call-set-direct-burndown"
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

# Port `activejob/destroy_association_async_test.rb` and flip the canonical models to `dependent: :destroy_async`

## Context

The `:destroy_async` arm itself landed with the wave-4d bundle (PR TBD): all
three bodies — `BelongsToAssociation#handle_dependency`
(`vendor/rails/activerecord/lib/active_record/associations/belongs_to_association.rb:14-35`),
`HasManyAssociation#handle_dependency` (`has_many_association.rb:30-55`) and
`HasOneAssociation#delete` (`has_one_association.rb:34-51`) — now park the Rails
payload on the owner's `_afterCommitJobs` via `enqueueDestroyAssociation`
(`association.rb:398-404`).

Two things were left out of that PR:

1. **The canonical models still say `dependent: "destroy"`.** Rails declares
   `dependent: :destroy_async` on `BookDestroyAsync`
   (`vendor/rails/activerecord/test/models/book_destroy_async.rb`) and
   `EssayDestroyAsync` (`.../essay_destroy_async.rb`). Ours
   (`packages/activerecord/src/test-helpers/models/book-destroy-async.ts`,
   `essay-destroy-async.ts`) carry `dependent: "destroy"` plus a now-stale
   comment claiming `AssociationOptions.dependent` lacks `"destroyAsync"` — it
   has carried that member for a while (`associations.ts:92-98`). Flipping them
   changes what the tests that already use those models observe, which is why it
   was not bundled with the arm.
2. **`vendor/rails/activerecord/test/activejob/destroy_association_async_test.rb`
   is unported.** It is the Rails-side coverage for the arm and needs the
   ActiveJob test helpers (`assert_enqueued_jobs` / `perform_enqueued_jobs`)
   trails has not ported. The arm currently has trails-only coverage one layer
   down: `packages/activerecord/src/associations/destroy-async-dependent-arm.trails.test.ts`
   asserts the enqueued payload directly.

## Acceptance criteria

- [ ] `book-destroy-async.ts` and `essay-destroy-async.ts` declare
      `dependent: "destroyAsync"` exactly where Rails does; the stale
      "until the type is widened" comments are gone.
- [ ] `destroy_association_async_test.rb` is enrolled and ported (test names
      verbatim), or the enqueue/perform helpers it needs are filed as their own
      blocker story with the specific gap named.
- [ ] The trails-only arm test is folded into the ported file if it becomes
      redundant.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
