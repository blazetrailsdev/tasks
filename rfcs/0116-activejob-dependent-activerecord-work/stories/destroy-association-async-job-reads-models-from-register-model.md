---
title: "destroy-association-async-job-reads-models-from-register-model"
status: ready
updated: 2026-10-29
rfc: "0116-activejob-dependent-activerecord-work"
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

## Context

`ActiveRecord::DestroyAssociationAsyncJob#perform` (`vendor/rails/v8.0.2/activerecord/lib/active_record/destroy_association_async_job.rb:20-21`) resolves both class names with `association_class.constantize` and `owner_model_name.constantize`. trails (`packages/activerecord/src/destroy-association-async-job.ts`, trails#9432) cannot add `constantize` (root CLAUDE.md § "Constant lookup is an import or a registry"). It calls `computeType(Base, name.replace(/^(::)?/, "::"))`, where the leading `::` makes `computeType` (`inheritance.ts`) skip its candidate search and do a top-level lookup. The regex and the `computeType` call are an invented stand-in.

## Converged shape

Once `registerModel` (`packages/activerecord/src/associations.ts`) gains a name → class read over its own map, as CLAUDE.md says a reader like `compute_type` converts, `perform` reads both models from it. The regex goes away:

```ts
const associationModel = <registry read>(associationClass);
const ownerClass = <registry read>(ownerModelName);
```

## Acceptance criteria

- `perform` resolves both names through the `registerModel` registry read, with no `computeType` call and no regex.
- The `@inventedArm replace` receipt on `perform` is removed.
- `destroy-association-async-job*.test.ts` stay green.
