---
rfc: "0000-activejob-dependent-activerecord-work"
title: "ActiveJob-dependent ActiveRecord work: the dependent: :destroy_async closure"
status: draft
created: 2026-08-21
updated: 2026-08-21
owner: "@deanmarano"
packages:
  - "activerecord"
clusters:
  - "api-compare"
related-rfcs:
  - "0106-wide-call-set-direct-burndown"
  - "0023-surfaced-deviations"
priority: 6
---

# ActiveJob-dependent ActiveRecord work: the `dependent: :destroy_async` closure

## Summary

Collect, in one place, the ActiveRecord work that is **blocked on trails having
no ActiveJob package** — so that when ActiveJob is ported, the AR-side follow-on
is a scheduled queue rather than a re-derivation. This RFC owns none of the
ActiveJob port itself.

It is filed `draft` deliberately. ActiveJob is **not being ported yet** (owner
decision, 2026-08-21). Nothing here becomes `ready` until an ActiveJob RFC
exists and lands its `TestHelper` slice; see `## Rollout`.

## Motivation

`dependent: :destroy_async` is half-landed on `main` and has been since PR #6762
(merged 2026-08-20). The dependent arm itself works — `BelongsToAssociation`,
`HasManyAssociation` and `HasOneAssociation` all reach
`Association#enqueueDestroyAssociation`
(`packages/activerecord/src/associations/association.ts:1067`), which parks
`[jobClass, options]` on `owner._afterCommitJobs` exactly as Rails does
(`associations/association.rb:402`).

Nothing ever drains that array, and the surface has no Rails-ported test. Two
stories filed against RFC 0106 to fix that were closed on 2026-08-21 with
"ActiveJob is not being ported yet"
(`destroy-async-test-port-and-model-flip`,
`port-activejob-test-helper-for-destroy-association-async`). Closing them was
right — they were blocking a call-set burndown on a framework package that does
not exist — but it leaves the work untracked. This RFC is where it goes.

### F1 — the after-commit drain is an empty stub, and its stated reason is stale

`packages/activerecord/src/associations/builder/association.ts:284`:

```ts
  static addAfterCommitJobsCallback(_model: any, _dependent: string): void {
    // Rails registers an after_commit that runs _after_commit_jobs for
    // dependent: :destroy_async. Requires after_commit infrastructure
    // which is not yet wired to the callback chain — skip until then.
  }
```

against `associations/builder/association.rb:145-162`, which registers an
`after_commit` that iterates `_after_commit_jobs` calling
`job_class.perform_later(**job_arguments)`, and defines the `_after_commit_jobs`
reader on the generated-methods mixin.

**The comment's reason no longer holds.** `after_commit` is wired —
`packages/activerecord/src/transactions.ts:173` exports it, and
`hasTransactionalCallbacks` reads `chain.isEmpty` since PR #6741. The only
missing piece is `perform_later`. So this is one Rails method blocked on one
ActiveJob method, not on AR infrastructure, and the stub comment should be
corrected to say so whether or not the rest of this RFC ever runs.

Note also that the stub is an empty body kept only to satisfy a call site —
exactly the shape CLAUDE.md's "no empty stubs" rule is about. It survives
because `parity:api` scores the name as present.

### F2 — three Rails test files, 28 tests, entirely unported

`vendor/rails/activerecord/test/activejob/` is a test directory trails has no
counterpart for at all:

| file                                    | code lines | tests |
| --------------------------------------- | ---------: | ----: |
| `destroy_association_async_test.rb`     |        367 |    21 |
| `destroy_association_async_job_test.rb` |         49 |     5 |
| `job_runtime_test.rb`                   |         29 |     2 |
| `helper.rb` / `unloadable_base_job.rb`  |         10 |     — |

They need `ActiveJob::TestHelper`'s `assert_enqueued_jobs`,
`perform_enqueued_jobs`, `assert_enqueued_with`, `assert_no_enqueued_jobs`, plus
an enqueue/perform runtime to execute
`ActiveRecord::DestroyAssociationAsyncJob` (`destroy_association_async_job.rb`,
**27 code lines** — the AR half is trivial; the runtime under it is not).

### F3 — the canonical models are not flipped

`book-destroy-async.ts` / `essay-destroy-async.ts` still declare the non-async
dependent option. Flipping them is now **safe** — #6762 shipped the arm — but
pointless while nothing drains the queue and no test observes it, so it belongs
here rather than as a standalone change.

## The ActiveJob port this depends on (sizing, measured 2026-08-21)

Recorded here so the future ActiveJob RFC does not re-derive it. Rails code
lines, comments and blanks stripped.

ActiveJob is the **smallest framework package Rails ships** — 54% of
ActiveModel's lib, 13% of ActiveSupport's, 5.3% of ActiveRecord's:

| package       | lib files |  lib code | test files | test code |   tests |
| ------------- | --------: | --------: | ---------: | --------: | ------: |
| **activejob** |    **49** | **2,066** |     **22** | **4,721** | **416** |
| activemodel   |        71 |     3,816 |         57 |     7,975 |     963 |
| activesupport |       281 |    15,693 |        163 |    30,166 |   2,864 |
| activerecord  |       393 |    38,911 |        427 |    98,804 |   9,035 |

The subset this RFC's closure actually needs is ~**1,135 Ruby code lines**:
`test_helper.rb` 272, `serializers/**` 182, `arguments.rb` 149, `core.rb` 102,
`enqueuing.rb` 71, `test_adapter.rb` 61, `queue_adapter.rb` 52,
`serializers.rb` 47, `execution.rb` 38, plus `base/callbacks/queue_name/
queue_priority/queue_adapters/configured_job` 161. The ten real backend adapters
(sidekiq, resque, delayed_job, …) total ~350 lines and are **not** in it.

At trails' measured Ruby→TS line ratio for ported packages (activemodel 2.36x,
activesupport 1.55x, activerecord 2.68x) that subset is ~**2,500 TS lines**, or
4–6 PRs at the LOC ceiling.

**The trap in that estimate:** `test_helper.rb` is 272 lib lines but its own
Rails test file, `test_helper_test.rb`, is **1,774 code lines and 215 tests —
52% of ActiveJob's entire suite**. The assertion helpers AR wants are the most
heavily specified thing in the package, so a faithful port of the subset is
6–8 PRs, not 4.

## Non-goals

- **The ActiveJob port itself.** It needs its own RFC, owned separately and
  broken down per file. This RFC only consumes it.
- **Backend queue adapters.** Only `TestAdapter` (and arguably `AsyncAdapter`)
  are in any trails closure; sidekiq/resque/delayed_job/etc. are never ported.
- **`enqueue_after_transaction_commit`.** Adjacent and also ActiveJob-dependent,
  but it is a `Base` config concern rather than part of the `:destroy_async`
  closure. File it here if it turns out to share the drain path; otherwise it is
  its own thing.

## Rollout

0. **Prerequisite (not owned here):** an ActiveJob RFC exists and has landed
   `Arguments`, `Core`, `Enqueuing`, `Execution`, `QueueAdapter`, `TestAdapter`
   and `TestHelper`. Until then every story below stays `draft`.
1. `add_after_commit_jobs_callback` — replace the empty stub with the Rails body
   (F1). Depends only on `perform_later` existing.
2. Port `destroy_association_async_job_test.rb` (5 tests) and
   `job_runtime_test.rb` (2 tests) — the small half of F2.
3. Port `destroy_association_async_test.rb` (21 tests) and flip
   `book-destroy-async.ts` / `essay-destroy-async.ts` (F2 + F3).

## Verification

- `parity:test` credits all 28 tests in `vendor/rails/activerecord/test/activejob/`.
- `associations/builder/association.ts` carries no empty-bodied
  `addAfterCommitJobsCallback`; `parity:api:calls` shows it calling what
  `association.rb:145-162` calls.
- A destroyed parent with a `dependent: :destroy_async` association enqueues
  `DestroyAssociationAsyncJob` on commit, observable through
  `assert_enqueued_with`, and the children are gone after
  `perform_enqueued_jobs`.
- `destroy-async-dependent-arm.trails.test.ts` — the trails-only cover written
  while ActiveJob was absent — is retired or reduced to whatever the Rails tests
  do not cover, per the "TS-only extras" convention.

## Open questions

1. **Does `_after_commit_jobs` need the generated-methods mixin?** Rails defines
   the reader on `model.generated_association_methods` and guards on
   `mixin.method_defined?`. trails parks the array directly on the owner
   instance (`association.ts:1071`). Decide at story 1 whether the mixin
   placement is observable; if it is not, say so at the call site rather than
   porting the `class_eval`.
2. **Is `AsyncAdapter` in scope for the prerequisite?** `TestAdapter` alone
   satisfies every test above. Including `AsyncAdapter` (68 lines) is what makes
   `:destroy_async` usable by an actual trails app, which may or may not be a
   goal at that point.

## Changelog

- 2026-08-21: initial RFC, filed from the starved-RFC triage that closed
  `0106/destroy-async-test-port-and-model-flip` and
  `0106/port-activejob-test-helper-for-destroy-association-async`.
