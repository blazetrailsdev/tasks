---
title: "activerecord: every included / extended / inherited / singleton_method_added hook's behaviour is carried (14 skipped hooks)"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: skips
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SKIP_GROUPS[4]`/`[5]` remove 14 activerecord hooks from scoring. CLAUDE.md ratifies the _spelling_
(symbol-keyed `included`/`extended`, § "Module mixins") and one `inherited` deferral (`ModelSchema`,
§ "`inherited` is deferred to own-property memo guards"). The other bodies are unaudited:

- `inherited`: `core.rb`, `persistence.rb`, `reflection.rb`, `enum.rb`, `inheritance.rb`,
  `locking/optimistic.rb`, `attribute_methods.rb`, `attribute_methods/primary_key.rb`,
  `relation/delegation.rb`, `migration.rb` (all under `vendor/rails/v8.0.2/activerecord/lib/active_record/`).
- `included`: `connection_adapters/abstract/query_cache.rb`.
- `extended`: `enum.rb`.
- `singleton_method_added`: `scoping/named.rb` (warns when a scope name collides with a class method).

## Acceptance criteria

- [ ] Each hook body is mapped to its trails carrier (symbol-keyed callback, own-property memo guard, or the `define`-time registration) in the PR body, with a test per hook proving the Rails-observable effect.
- [ ] Any hook with no carrier is ported, or filed as its own story in this RFC with the Rails `file:line`.
- [ ] `scoping/named.rb`'s `singleton_method_added` warning is ported (a scope colliding with a class method logs as Rails does).
