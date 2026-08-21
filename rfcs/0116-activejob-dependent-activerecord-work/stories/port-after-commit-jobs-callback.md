---
title: "Port add_after_commit_jobs_callback — the drain that runs _after_commit_jobs on commit"
status: draft
updated: 2026-08-21
rfc: "0116-activejob-dependent-activerecord-work"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/associations/builder/association.ts:284` is an empty
stub:

```ts
static addAfterCommitJobsCallback(_model: any, _dependent: string): void {
  // Rails registers an after_commit that runs _after_commit_jobs for
  // dependent: :destroy_async. Requires after_commit infrastructure
  // which is not yet wired to the callback chain — skip until then.
}
```

Rails (`vendor/rails/activerecord/lib/active_record/associations/builder/association.rb:145-162`):

```ruby
def self.add_after_commit_jobs_callback(model, dependent)
  if dependent == :destroy_async
    mixin = model.generated_association_methods

    unless mixin.method_defined?(:_after_commit_jobs)
      model.after_commit(-> do
        _after_commit_jobs.each do |job_class, job_arguments|
          job_class.perform_later(**job_arguments)
        end
      end)

      mixin.class_eval <<-CODE, __FILE__, __LINE__ + 1
        def _after_commit_jobs
          @_after_commit_jobs ||= []
        end
      CODE
    end
  end
end
```

The call site is already correct: `association.ts:190` calls
`this.addAfterCommitJobsCallback(model, dependent)` from `build`, where Rails
calls it (`association.rb:81`).

**The stub's stated reason is stale.** `after_commit` IS wired —
`packages/activerecord/src/transactions.ts:173` exports it, and
`hasTransactionalCallbacks` has read `chain.isEmpty` since PR #6741. The only
thing actually missing is `perform_later`, i.e. ActiveJob. Whoever takes this
story should not trust that comment; verify against `transactions.ts` first.

The producer side is already ported and green: `enqueueDestroyAssociation`
(`associations/association.ts:1067`) pushes `[jobClass, options]` onto
`owner._afterCommitJobs`, matching `association.rb:402`. Nothing consumes it.

## Acceptance criteria

- `addAfterCommitJobsCallback` carries the Rails body — the `:destroy_async`
  guard, the define-once check, the `after_commit` registration, and the
  `_after_commit_jobs` reader — with no empty arm and no trails-only helper.
- The `mixin.method_defined?` define-once semantics are preserved: two
  `dependent: :destroy_async` associations on one model register the callback
  once, not twice. A test asserts the callback count.
- A destroyed parent enqueues one job per parked entry, and
  `owner._afterCommitJobs` does not leak across instances.
- Open question 1 of this RFC is answered at the call site: either the
  `generated_association_methods` placement is observable and is ported, or it
  is not and a one-line comment says why the owner-instance field is equivalent.
- `pnpm parity:api:calls` green with **no new row** in
  `call-mismatches-exclude/activerecord/associations/builder/association.json`.

## Definition of done

Not done if the body is ported but `perform_later` is stubbed, faked, or routed
through a trails-only runner — that is the alternative this RFC explicitly
rejected. This story lands only on top of a real ActiveJob `perform_later`.
