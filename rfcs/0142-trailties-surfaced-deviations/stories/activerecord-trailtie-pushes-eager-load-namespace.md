---
title: "ActiveRecord trailtie pushes no eager-load namespace; ActiveRecord.eagerLoadBang lacks the active_record.rb override"
status: in-progress
updated: 2026-09-26
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 4
pr: trails#8131
claim: "2026-09-26T02:32:09Z"
assignee: "mapper-root-ships-only-one-of-two-arms"
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActiveRecord::Railtie` pushes its namespace: `config.eager_load_namespaces << ActiveRecord` (`vendor/rails/activerecord/lib/active_record/railtie.rb:44`). trails' `packages/trailties/src/trailties/active-record.ts` does not push anything, so `Finisher`'s `eager_load!` initializer (`packages/trailties/src/application/finisher.ts`, `railties/lib/rails/application/finisher.rb:76-81`) never eager-loads ActiveRecord.

Separately, `ActiveRecord.eager_load!` (`active_record.rb:499-507`) calls `super` and then `Locking`, `Scoping`, `Associations`, `AttributeMethods`, `ConnectionAdapters` and `Encryption` `.eager_load!`. trails ports it as the module function `eagerLoadBang` in `packages/activerecord/src/active-record.ts`, which covers only Associations and Encryption. The `ActiveRecord` namespace object (`packages/activerecord/src/namespaces.ts`) still answers the bare `Autoload#eagerLoadBang`. trails#8104 converged ActiveModel and GlobalID onto the override shape (`Object.defineProperty(ns, "eagerLoadBang", …)`, as in `encryption.ts`).

## Acceptance criteria

- The ActiveRecord trailtie pushes the `ActiveRecord` namespace object onto `config.eagerLoadNamespaces`.
- `ActiveRecord.eagerLoadBang` on the namespace object is the `active_record.rb:499-507` override: `super`, then each listed submodule's `eagerLoadBang`, in that order. A submodule that has no namespace object yet gets one.
- The finisher test that boots `eager_load!` with `eagerLoad = true` covers the ActiveRecord trailtie too.
