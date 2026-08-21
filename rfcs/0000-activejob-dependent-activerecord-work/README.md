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
  - "rails-deviation"
related-rfcs:
  - "0106-wide-call-set-direct-burndown"
  - "0023-surfaced-deviations"
priority: 10
---

# RFC — ActiveJob-dependent ActiveRecord work: the `dependent: :destroy_async` closure

## Summary

Collect, in one place, the ActiveRecord work that is **blocked on trails having
no ActiveJob package** — so that when ActiveJob is ported, the AR-side follow-on
is a scheduled queue rather than a re-derivation. This RFC owns none of the
ActiveJob port itself.

It is filed `draft` deliberately. ActiveJob is **not being ported yet** (owner
decision, 2026-08-21). Nothing here becomes `ready` until an ActiveJob RFC
exists and lands its `TestHelper` slice; that is Rollout step 0.

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

Six canonical models — `book-destroy-async.ts`, `essay-destroy-async.ts`,
`destroy-async-parent.ts`, `destroy-async-parent-soft-delete.ts`,
`dl-keyed-belongs-to.ts`, `dl-keyed-belongs-to-soft-delete.ts` — still declare
the non-async dependent option, each behind a comment claiming
`AssociationOptions.dependent`'s type union "doesn't include it yet".

**That comment is stale twice over.** The union at `associations.ts:92-98`
already carries `"destroyAsync"`, and the runtime arm landed in #6762. Nothing
blocks the flip today except that, with no drain (F1) and no job (F2), it would
be an unobserved behaviour change. It belongs here rather than as a standalone
change — and the six stale comments come out with it.

## Design

Nothing here is a new mechanism. Every piece is a Rails body trails already has
a seat for, waiting on one ActiveJob method:

```text
Model#destroy
  → Association#handle_dependency             (ported, #6762)
  → Association#enqueue_destroy_association    (ported, association.ts:1067)
        owner._after_commit_jobs << [job_class, options]
  → after_commit { _after_commit_jobs.each { |k, a| k.perform_later(**a) } }
        ^^^^^ THE GAP: builder/association.ts:284 is an empty stub
  → DestroyAssociationAsyncJob#perform         (27 Ruby lines, unported)
        owner_class.find(owner_id) … association_class.where(...).find_each(&:destroy)
```

The chain is intact up to the drain and absent after it. So the design is: port
`add_after_commit_jobs_callback` verbatim (story 1), port the 27-line job
(story 2), then port the Rails tests that observe the whole chain and flip the
canonical models so they exercise it (story 3). No trails-only seam is
introduced at any step, and the trails-only cover written while ActiveJob was
absent (`destroy-async-dependent-arm.trails.test.ts`) is retired by story 3 in
favour of the Rails tests.

The one open design question — whether `_after_commit_jobs` needs Rails'
`generated_association_methods` mixin placement — is in `## Open questions` and
is settled at story 1, not here.

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
`serializers.rb` 47, `execution.rb` 38, plus `base` / `callbacks` /
`queue_name` / `queue_priority` / `queue_adapters` / `configured_job` 161. The
ten real backend adapters (sidekiq, resque, delayed_job, …) total ~350 lines and
are **not** in it.

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

## Alternatives considered

- **Port a trails-only "job runner" seam instead of ActiveJob.** A minimal
  enqueue/perform shim under `activerecord/` would unblock the drain and the
  tests without a new package. Rejected: it is invented surface with no Ruby
  counterpart (`parity:api:extra` would flag every name), the Rails tests assert
  through `ActiveJob::TestHelper`'s API, and it would have to be deleted the day
  ActiveJob lands. This is the "a documented deviation is debt" rule applied
  before the debt is written.
- **Roll the ActiveJob port into this RFC.** Rejected: it annexes a whole
  framework package into an RFC named for its consumer, and ActiveJob is not
  being ported yet (owner decision, 2026-08-21). The sizing above is recorded
  here precisely so that RFC can be written from it later.
- **Leave the work untracked until ActiveJob exists.** The status quo before
  this RFC. Rejected: the two RFC 0106 stories closed on 2026-08-21 already
  carried the analysis, and dropping it means re-deriving `test/activejob/`'s
  contents, the stale-stub finding, and the sizing from scratch.
- **Delete the half-landed `:destroy_async` arm until it can be finished.**
  Rejected: #6762's arm is faithful and green; removing it would be a
  convergence regression, and the models simply do not use it yet.

## Supersedes

This RFC is the single owner of the `:destroy_async` closure, which means three
RFC 0023 stories that predate it are superseded — closed with `closed-reason`
pointers to the successor story ids (ids, not RFC numbers: this RFC is
unnumbered until merge, and `finalize-rfc.mjs` rewrites references only inside
its own directory, so a `0000-` reference written into 0023 would go stale
permanently).

| superseded 0023 story                                 | successor                                             | why not simply reused                                                                                                                                                                                                                                                                 |
| ----------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `converge-dependent-destroy-async-arms-and-drain`     | `port-after-commit-jobs-callback`                     | Two of its three parts **landed in #6762** (the three `:destroy_async` arms, and real callers for `enqueueDestroyAssociation`). Its opening claim — "`enqueueDestroyAssociation` … definition only — ZERO callers" — is stale. Only the drain survives, which is the successor story. |
| `port-destroy-association-async-job-and-default`      | `port-destroy-association-async-job`                  | Same scope; its detail (the `core.rb:24` default, `DestroyAssociationAsyncError`, the unported-files pin, the deferred autoload case) is absorbed verbatim into the successor, with the moved file path corrected.                                                                    |
| `converge-destroy-async-test-models-to-destroy-async` | `port-destroy-association-async-test-and-flip-models` | Same six-model flip. Its stated blocker ("depends on a default job existing") is now this RFC's story 2, so the dependency is expressible here and was not there.                                                                                                                     |

Two adjacent 0023 stories are **not** superseded and stay where they are:
`book-destroy-async-model-drops-scope-and-published-override` (a reflection
scope and an enum bang override, correct on either `dependent:` arm) and
`eachslice-zero-size-raises` (a Ruby-idiom fix surfaced by #6762's review).
The first one's prose pointed at `destroy-async-test-port-and-model-flip`, a
story closed on 2026-08-21; it is repointed at this RFC's capstone.

## Rollout

0. **Prerequisite (not owned here):** an ActiveJob RFC exists and has landed
   `Arguments`, `Core`, `Enqueuing`, `Execution`, `QueueAdapter`, `TestAdapter`
   and `TestHelper`. Until then every story below stays `draft`; promoting one
   before that is what this RFC exists to prevent.
1. `port-after-commit-jobs-callback` — replace the empty stub with the Rails
   body (F1). Depends only on `perform_later` existing.
2. `port-destroy-association-async-job` — the 27-line job plus its 5-test and
   2-test Rails files (the small half of F2).
3. `port-destroy-association-async-test-and-flip-models` — the 21-test file and
   the canonical model flip (F2 + F3). Depends on 1 and 2.

## Stories

- `port-after-commit-jobs-callback` (F1)
- `port-destroy-association-async-job` (F2, small half)
- `port-destroy-association-async-test-and-flip-models` (F2 + F3)

All three are `draft` and stay that way until Rollout step 0 is satisfied.

## Verification

- `parity:test` credits all **28** tests in
  `vendor/rails/activerecord/test/activejob/` — 21 + 5 + 2, the number, not a
  subset.
- `associations/builder/association.ts` carries no empty-bodied
  `addAfterCommitJobsCallback`; `pnpm parity:api:calls` shows it calling what
  `association.rb:145-162` calls, with **no new baseline row** in
  `call-mismatches-exclude/activerecord/associations/builder/association.json`.
- A destroyed parent with a `dependent: :destroy_async` association enqueues
  `DestroyAssociationAsyncJob` on commit, observable through
  `assert_enqueued_with`, and the children are gone after
  `perform_enqueued_jobs`.
- `destroy-async-dependent-arm.trails.test.ts` — the trails-only cover written
  while ActiveJob was absent — is retired, or reduced to whatever the Rails
  tests do not cover, per the TS-only-extras convention.
- SQLite, PostgreSQL and MySQL/MariaDB lanes green on every story.

## Open questions

1. **Does `_after_commit_jobs` need the generated-methods mixin?** Rails defines
   the reader on `model.generated_association_methods` and guards on
   `mixin.method_defined?`. trails parks the array directly on the owner
   instance (`association.ts:1071`). Settled at story 1: if the placement is not
   observable, say so at the call site rather than porting the `class_eval`;
   if it is, port it. Deferred to that story, not to `active`.
2. **Is `AsyncAdapter` in scope for the prerequisite?** `TestAdapter` alone
   satisfies every test above. Including `AsyncAdapter` (68 lines) is what makes
   `:destroy_async` usable by an actual trails app, which may or may not be a
   goal at that point. Deferred to the ActiveJob RFC — it is that RFC's scope
   decision, not this one's.

## Changelog

- 2026-08-21: initial RFC, filed from the starved-RFC triage that closed
  `0106/destroy-async-test-port-and-model-flip` and
  `0106/port-activejob-test-helper-for-destroy-association-async`.
