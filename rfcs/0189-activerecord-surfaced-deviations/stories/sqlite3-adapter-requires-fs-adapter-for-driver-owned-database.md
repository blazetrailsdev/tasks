---
title: "sqlite3-adapter-requires-fs-adapter-for-driver-owned-database"
status: draft
updated: 2026-11-20
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: ["activerecord"]
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

`SQLite3Adapter`'s constructor (`packages/activerecord/lib/connection-adapters/sqlite3-adapter.ts:193-206`, mirroring `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:111-120`) expands, `dirname`s and `mkdir -p`s a non-`file:` database path, and `HashConfig#defaultSchemaCachePath` `File.join`s, so connecting needs a registered fs/path adapter. expo-sqlite keeps its database in its own directory and takes a bare name; on React Native there is no fs adapter at all.

Found building `examples/react-native-notes` (trails#10425), which works around it in the example; see its README row 8.

## Acceptance criteria

- A driver that owns its database directory (expo-sqlite) can be connected with a bare name and no fs adapter registered, without changing the Rails arm for file-backed drivers.
- ruby-compat's path half works with no fs adapter (or ships a pure-JS path backend), so `File.join` does not raise outside Node.
