---
title: "ActiveJob.eager_load! loads every autoloaded constant: complete namespaces.ts loadPath and seats"
status: draft
updated: 2026-10-06
rfc: "0169-activejob-package-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activejob/src/namespaces.ts` (trails#8568) ports `vendor/rails/v8.0.2/activejob/lib/active_job.rb:37-50`: every `autoload` line, with `Serializers` and `ConfiguredJob` inside the `eager_autoload` block (`:44-47`). Its `loadPath` table has one entry, `"active_job/base"`, because that was the only file that existed.

So `ActiveJob.eagerLoadBang()` (`packages/activesupport/src/dependencies/autoload.ts:80-89`) currently throws a `TypeError` on `this.loadPath["active_job/serializers"]`: no entry. Each story that ports a file is expected to add its `loadPath` entry and seat its constant with `rbModConstSet(ActiveJob, "<Name>", …)`, but no story owns checking that all ten landed. The same holds for `QueueAdapters` and `Serializers`, which are `Autoload`-extended objects in `namespaces.ts` with no `autoload` lines yet (`queue_adapters.rb:113-125`, `serializers.rb:9-23`) and are not yet seated on `ActiveJob`.

Rails: `ActiveSupport::Autoload#eager_load!` (`vendor/rails/v8.0.2/activesupport/lib/active_support/dependencies/autoload.rb`) `const_get`s each eager constant; `Serializers` and `QueueAdapters` then resolve their own members by name (`serializers.rb:43` `safe_constantize`, `queue_adapters.rb:132-134` `const_get`).

## Acceptance criteria

- [ ] `loadPath` in `packages/activejob/src/namespaces.ts` has an entry for every `autoload` in `active_job.rb:37-50`, `queue_adapters.rb:115-125` (ported adapters only) and `serializers.rb:11-23`.
- [ ] `await ActiveJob.eagerLoadBang()` resolves and leaves `ActiveJob.Serializers` and `ActiveJob.ConfiguredJob` seated; a `.trails.test.ts` covers it.
- [ ] `ActiveJob.QueueAdapters` and `ActiveJob.Serializers` are seated by `queue-adapters.ts` / `serializers.ts`, and `constantize("ActiveJob::Serializers::SymbolSerializer")` resolves.
- [ ] Plain-node import of each built `dist/*.js` named in `loadPath`, as the entry module, succeeds (no TDZ).

Run after the last lib story of RFC 0169 lands.
