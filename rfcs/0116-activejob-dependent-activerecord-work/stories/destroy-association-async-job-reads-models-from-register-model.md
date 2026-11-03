---
title: "DestroyAssociationAsyncJob#perform resolves both models with constantize"
status: in-progress
updated: 2026-11-03
rfc: "0116-activejob-dependent-activerecord-work"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#9670
claim: "2026-11-03T15:28:59Z"
assignee: "destroy-association-async-job-reads-models-from-register-model"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::DestroyAssociationAsyncJob#perform` (`vendor/rails/v8.0.2/activerecord/lib/active_record/destroy_association_async_job.rb:20-21`) resolves both class names with `association_class.constantize` and `owner_model_name.constantize`. trails (`packages/activerecord/src/destroy-association-async-job.ts:36-37`) calls `computeType(Base, name.replace(/^(::)?/, "::"))` instead, receipted `@inventedArm replace` / `@inventedArm computeType — CONVERGEABLE` against this story (`:18-19`).

This story first targeted a `registerModel` name → class read. That premise is gone: RFC 0213 retired `registerModel` (trails#9656) and reversed the constant-lookup ruling (root CLAUDE.md § "Constant lookup is an import or a registry", 2026-10-30), and `constantize` is ported (`packages/activesupport/src/inflector.ts:183`). The slug is kept so the receipts still resolve.

## Acceptance criteria

- [ ] `perform` resolves both names with `constantize(associationClass)` / `constantize(ownerModelName)`, with no `computeType` call and no regex.
- [ ] Both `@inventedArm` receipts on `perform` are removed.
- [ ] `destroy-association-async-job*.test.ts` stay green.
