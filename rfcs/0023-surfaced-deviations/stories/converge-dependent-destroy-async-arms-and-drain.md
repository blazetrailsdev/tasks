---
title: "Converge dependent: destroy_async — the arms and the after_commit drain are both missing"
status: closed
updated: 2026-08-21
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by story port-after-commit-jobs-callback in the ActiveJob-dependent ActiveRecord work RFC (tasks PR #75). Two of this story's three parts already LANDED in trails #6762 (merged 2026-08-20) — the three dependent: :destroy_async arms on BelongsTo/HasMany/HasOne, and real callers for enqueueDestroyAssociation — so its opening measurement ('definition only — ZERO callers') is stale. Only the after_commit drain survives, and that is the successor story, which cannot be scheduled until trails has ActiveJob's perform_later."
---

# Converge `dependent: :destroy_async` — the arms and the drain are both missing

## Context

Surfaced by PR #6725 (RFC 0106 wave 4d) while measuring the association
call-set rows. `dependent: :destroyAsync` is a **declarable option that does
the wrong thing at runtime**, and three separate pieces are missing.

Measured on `main` (2026-08-18):

```console
$ grep -rn "enqueueDestroyAssociation" packages/activerecord/src --include=*.ts
associations/association.ts:1061:  private enqueueDestroyAssociation(...)   # definition only — ZERO callers

$ grep -rn "_afterCommitJobs" packages/activerecord/src --include=*.ts
associations/association.ts:1065  ownerAny._afterCommitJobs ??= [];         # written
associations/association.ts:1066  ownerAny._afterCommitJobs.push(...)       # written — NEVER read
```

The option is nonetheless validated as legal: `builder/association.ts:244`
raises `ConfigurationError` unless `model.destroyAssociationAsyncJob()` is set,
and `builder/has-many.ts` / `builder/belongs-to.ts` list `"destroyAsync"` in
`validOptions`. So a user declares it, passes validation, and silently gets the
**wrong** behaviour — not an error.

### What actually happens today

No association body has a `destroyAsync` arm, so each falls through to its
`default:`:

- `HasOneAssociation#delete` (`has-one-association.ts`) → `default:` calls
  `target.destroy()` — a **synchronous destroy** where Rails enqueues a job.
- `HasManyAssociation#handleDependency` (`has-many-association.ts`) →
  `default:` calls `deleteAll()` — deletes/nullifies rather than enqueueing.
- `BelongsToAssociation#handleDependency` — no arm either.

## The converged shape

Three pieces, all with Rails sources in `vendor/rails/activerecord/lib/`:

1. **`Builder::Association.addAfterCommitJobsCallback`** —
   `active_record/associations/builder/association.rb:145-163`, called from
   `define_callbacks` at `:81`. Registers an `after_commit` that drains the
   queue:

   ```ruby
   model.after_commit(-> do
     _after_commit_jobs.each do |job_class, job_arguments|
       job_class.perform_later(**job_arguments)
     end
   end)
   ```

   This is entirely absent from `builder/association.ts` and is why
   `_afterCommitJobs` is write-only. It also defines the `_after_commit_jobs`
   reader (`@_after_commit_jobs ||= []`) on the generated-methods mixin.

2. **`Association#enqueue_destroy_association`** —
   `active_record/associations/association.rb:398-404`. trails already has this
   at `associations/association.ts:1061` and it matches; it just needs callers
   (and to stop being `private` if the subclasses need it).

3. **The three `:destroy_async` arms:**
   - `HasOneAssociation#delete` — `has_one_association.rb:36-52`. Branches on
     `target.class.query_constraints_list` for the composite-PK case, builds
     `id`, then `enqueue_destroy_association(owner_model_name:, owner_id:,
association_class:, association_ids: [id], association_primary_key_column:,
ensuring_owner_was_method: options.fetch(:ensuring_owner_was, nil))`.
     Note `options.fetch(:ensuring_owner_was, nil)` is a Ruby `fetch` — see
     CLAUDE.md on `fetch` vs `??`.
   - `HasManyAssociation#handle_dependency` — `has_many_association.rb:30-55`.
     Same shape but batched:
     `ids.each_slice(owner.class.destroy_association_async_batch_size || ids.size)`.
   - `BelongsToAssociation#handle_dependency` — `belongs_to_association.rb:13-38`.
     Resolves `association_class` through `reflection.polymorphic?` →
     `owner.public_send(reflection.foreign_type)`.

Retires these call-set baseline rows in
`scripts/api-compare/call-mismatches-exclude/activerecord/`:

```text
associations/has-one-association.json    delete             primary_key, id, klass, fetch, enqueue_destroy_association
associations/belongs-to-association.json handle_dependency  foreign_key, map, klass, id, fetch, enqueue_destroy_association
```

## Related

`converge-destroy-async-test-models-to-destroy-async`
(0023-surfaced-deviations) flips the test-helper models from
`dependent: "destroy"` to `destroyAsync` and is blocked on a working default
job — it should land AFTER this story, and its models are the natural coverage
for it. Rails' own tests live in
`vendor/rails/activerecord/test/cases/associations/belongs_to_associations_test.rb`
and `has_many_associations_test.rb` (search `destroy_async`).

## Acceptance criteria

- [ ] `Builder::Association.addAfterCommitJobsCallback` ported and wired from
      the builder's callback-definition path, so `_afterCommitJobs` is drained
      on commit.
- [ ] The three `:destroy_async` arms ported, each matching its Rails body
      line for line (branch order, `fetch` semantics, batch slicing).
- [ ] `enqueueDestroyAssociation` has real callers; no dead code left.
- [ ] `pnpm parity:api:calls` green with the listed rows deleted by hand via
      `serializeBaseline` + `parity:api:calls:tighten` (no reseed).
- [ ] Coverage proving a `destroyAsync` association enqueues rather than
      destroying inline — the current fall-through to `destroy()`/`deleteAll()`
      must fail on the baseline.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
