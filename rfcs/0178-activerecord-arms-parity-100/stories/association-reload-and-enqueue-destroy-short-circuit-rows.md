---
title: "activerecord: Association#reload and #enqueue_destroy_association take Rails' short-circuits"
status: claimed
updated: 2026-10-07
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-10-07T11:33:13Z"
assignee: "unskip-helper-test-default-helpers-and-alternate-dir"
blocked-by: null
closed-reason: null
---

## Context

After trails#8449 the invented-direction arms report has no `count` row left for part 1 of the associations files, but the short-circuit projection (`pnpm parity:api:arms:report --package=activerecord --direction=invented`) still lists two rows in `packages/activerecord/src/associations/association.ts`:

- `reload` — `+and`. Rails (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/association.rb:68-74`) is
  `klass.connection_pool.clear_query_cache if force && klass`, then `reset`, `reset_scope`, `load_target`, `self unless target.nil?`. trails tests `if (force)` with no `&& klass`, and spells `self unless target.nil?` twice inside a `loaded instanceof Promise ? … : …` ternary.
- `enqueueDestroyAssociation` — `+or`. Rails (`association.rb:392-398`) is `owner._after_commit_jobs.push([job_class, options])`. trails writes `ownerAny._afterCommitJobs ??= []` first, because the record has no `_after_commit_jobs` reader (Rails: `attr_accessor :_after_commit_jobs` in `associations.rb`, initialised by the `after_commit_jobs` callback in `associations/builder/association.rb:145-160`, whose trails port `addAfterCommitJobsCallback` is an empty body).

## Acceptance criteria

- [ ] `reload` guards the cache clear with `force && this.klass` and states `self unless target.nil?` once.
- [ ] `addAfterCommitJobsCallback` is ported from `builder/association.rb:145-160`, so `_afterCommitJobs` is initialised where Rails initialises it and `enqueueDestroyAssociation` is the bare `push`.
- [ ] The short-circuit projection shows no row for either method.
