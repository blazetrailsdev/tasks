---
title: "activerecord: retire SKIP_GROUPS' target/start/finish entry, which hides Association#target and Transaction#start"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: skips
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SKIP_GROUPS[9]` ("Migrator internal index helpers") skips the names `target`, `start`, `finish`
**globally**, so it silently drops eleven activerecord definitions from `parity:api`, most of which have
nothing to do with the Migrator:

- `Association#target` (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/association.rb:53`) and `CollectionProxy#target`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/collection_proxy.rb:40`) — core association API.
- `Transaction#start` / `#finish` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/transaction.rb:90`,101).
- `ExplainSubscriber#start` / `#finish` (`vendor/rails/v8.0.2/activerecord/lib/active_record/explain_subscriber.rb:8`,12).
- `BatchEnumerator#start` / `#finish` (`attr_reader`s, `vendor/rails/v8.0.2/activerecord/lib/active_record/relation/batches/batch_enumerator.rb`).
- `Migrator#target` / `#start` / `#finish` (`vendor/rails/v8.0.2/activerecord/lib/active_record/migration.rb:1545-1553`) — the group's actual subject:
  trails passes `@target_version` / `@direction` as parameters instead of storing them.

## Acceptance criteria

- [ ] `Migrator` stores `@target_version` / `@direction` and ports `target` / `start` / `finish` with Rails' bodies.
- [ ] `SKIP_GROUPS[9]` is deleted; every definition above is scored, ported where missing, and pinned.
- [ ] `pnpm parity:api` activerecord global skip −11; matched rises by the same count.

## Verification

```bash
pnpm parity:api && pnpm parity:api:pins && pnpm vitest run scripts/parity/conventions.test.ts
```
