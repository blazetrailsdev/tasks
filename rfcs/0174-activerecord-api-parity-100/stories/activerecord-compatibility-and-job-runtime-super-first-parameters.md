---
title: "activerecord: migration/compatibility TableDefinition modules and JobRuntime#instrument take Rails' parameter lists instead of super_"
status: claimed
updated: 2026-10-11
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: "2026-10-11T13:01:13Z"
assignee: "activerecord-compatibility-and-job-runtime-super-first-parameters"
blocked-by: null
closed-reason: null
---

## Context

trails#8764 and trails#8765 converged every `super_`-threading method that
`activerecord-super-first-parameters-onto-super-method` listed, plus the
prepended ones, onto `Module#superMethod`. Two activerecord files still open
their signatures with `super_`, so `pnpm parity:api --arity` still lists
activerecord rows that do:

- `packages/activerecord/src/migration/compatibility.ts` — the per-version
  `TableDefinition` modules (`column`, `change`, `index`, `references`,
  `belongsTo`, `newColumnDefinition`, `timestamps`, `primaryKey`) and
  `V5_2.CommandRecorder`. Rails defines each as a plain method calling `super`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/migration/compatibility.rb:70-92`,
  `:197-212`, `:234-245`) and prepends the module onto the yielded table's
  singleton class (`:158`, `:221`: `class << t; prepend TableDefinition; end`).
  trails prepends an object literal with `prepend(t as object, V7_0.TableDefinition)`,
  the wrapping helper from `ruby-compat/src/prepend.ts`.
- `packages/activerecord/src/trailties/job-runtime.ts` —
  `instrument(super_, operation, payload, block)`. Rails:
  `vendor/rails/v8.0.2/activerecord/lib/active_record/railties/job_runtime.rb:9-20`,
  a module method calling `super(operation, payload) do ... end` or bare `super`.

## Converged shape

Each module is a `Module` (`new Module().include({ ... })` keeps the members
credited by `parity:api`), its methods take Rails' parameter lists and call
`<Module>.superMethod(this, "<name>")!(...)`, and the prepend is the ancestry
splice (`prepend` from `@blazetrails/ruby-compat/include`, or
`rbObjSingletonClass(t)` for the per-object `class << t`), as
`encryption/extended-deterministic-queries.ts` does after trails#8765.

## Acceptance criteria

- [ ] No signature in `migration/compatibility.ts` or `trailties/job-runtime.ts`
      opens with `super_`.
- [ ] `pnpm parity:api --arity` lists no activerecord row whose TS signature
      opens with `super_`.
- [ ] `migration/compatibility.test.ts` and the job-runtime tests stay green on
      all three adapters.
