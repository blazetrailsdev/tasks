---
title: "Type.adapterNameFrom reads live connection instead of connection_db_config"
status: in-progress
updated: 2026-07-23
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 5179
claim: "2026-07-23T21:27:09Z"
assignee: "type-adapter-name-from-reads-connection-not-db-config"
blocked-by: null
closed-reason: null
---

## Context

Found by per-entry wide-call verification (#5096), left as reason prose there.
Rails `Type.adapter_name_from` (vendor/rails/activerecord/lib/active_record/type.rb:49-51)
reads `model.connection_db_config.adapter.to_sym` — the CONFIGURED adapter,
available without a live connection. Trails
(packages/activerecord/src/type.ts:127-133) reads
`model.connection?.adapterName ?? "sqlite"` — the live connection, silently
defaulting to sqlite when no connection is established, so type registry
lookups before connect resolve against the wrong adapter.

## Acceptance criteria

- adapterNameFrom resolves from the db config as Rails does (no live-
  connection dependency, no silent sqlite fallback when a config exists).
- Wide-exclude reason for type.ts adapter_name_from updated to plain
  verified wording.
