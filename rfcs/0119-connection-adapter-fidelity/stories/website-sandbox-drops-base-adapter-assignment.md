---
title: "website-sandbox-drops-base-adapter-assignment"
status: draft
updated: 2026-09-11
rfc: "0119-connection-adapter-fidelity"
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

`packages/website/src/lib/frontiers/sandbox-sw.ts:82,109` still assign `Base.adapter = adapter;`
(a `SqlJsAdapter`). trails#7679 retired `Base.adapter=` and trails#7685 deleted the getter.
The website package is not in the root `tsconfig.json` references, so `pnpm typecheck`
never caught the break. Rails has no `ActiveRecord::Base.adapter=`. Connections come
from `establish_connection` and the pool
(`vendor/rails/activerecord/lib/active_record/connection_handling.rb:50-60,269-311`).

## Acceptance criteria

- [ ] The sandbox wires its `SqlJsAdapter` through `establishConnection` or the connection handler or pool, with no `Base.adapter` reference.
- [ ] `replaceDatabase` (db:import) re-establishes the connection the same way.
- [ ] The website package typechecks.
