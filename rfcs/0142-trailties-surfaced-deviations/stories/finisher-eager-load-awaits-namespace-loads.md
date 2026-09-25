---
title: "Finisher eager_load! drops each namespace's async eagerLoadBang promise"
status: draft
updated: 2026-09-25
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' finisher `eager_load!` initializer runs `config.eager_load_namespaces.each(&:eager_load!)` (`vendor/rails/railties/lib/rails/application/finisher.rb:76-81`) synchronously, so every namespace is loaded before the next initializer runs.

In trails every `eagerLoadBang` (`activesupport/src/dependencies/autoload.ts`, plus the ActiveModel, GlobalID and Encryption overrides) is async, because it `import()`s. `packages/trailties/src/application/finisher.ts` calls `namespace.eagerLoadBang()` and drops the promise. So the loads are not finished when `finisher_hook` runs `after_initialize`, and a rejected load becomes an unhandled rejection.

## Acceptance criteria

- The `eager_load!` initializer awaits each namespace's `eagerLoadBang()` in order, using the initializer runner's existing async support, or adds that support.
- A finisher test proves a namespace's eager load has completed before `finisher_hook` runs.
