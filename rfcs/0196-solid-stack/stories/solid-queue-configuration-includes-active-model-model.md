---
title: "solid-queue-configuration-includes-active-model-model"
status: draft
updated: 2026-11-08
rfc: "0196-solid-stack"
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

`SolidQueue::Configuration` does `include ActiveModel::Model` (`vendor/solid_queue/v1.1.3/lib/solid_queue/configuration.rb:4-5`) and has no superclass. `packages/solid-queue/src/configuration.ts` writes `class Configuration extends Model`, so `pnpm parity:api --package solid-queue --inheritance` reports `configuration.ts:Configuration ruby<(none)> ts<Model>`, the last solid-queue inheritance miss (33/34).

`ActiveModel::Model` in trails (`packages/activemodel/src/model.ts`) is a plain class, not an includable module (`classModule` / plain object), so `include(Configuration, Model)` is not available. ActiveRecord's `Base extends Model` carries the same shape and is whitelisted in `TS_ROOT_INTERMEDIATE` (`scripts/api-compare/compare.ts`).

## Acceptance criteria

- `Configuration` takes `ActiveModel::Model` by `include()` (with its `included` hook running `extend`s for validations), not by `extends`.
- `pnpm parity:api --package solid-queue` reports inheritance 34/34; no `TS_ROOT_INTERMEDIATE` row is added.
