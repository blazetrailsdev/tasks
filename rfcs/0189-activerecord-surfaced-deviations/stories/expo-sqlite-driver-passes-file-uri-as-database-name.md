---
title: "expo-sqlite-driver-passes-file-uri-as-database-name"
status: draft
updated: 2026-11-20
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Connecting expo-sqlite with `database: "file:notes.db"` (the only spelling that skips the directory branch today, see `sqlite3-adapter.ts:193`) reaches `openDatabaseAsync(config.database, ...)` at `packages/activerecord/lib/sqlite/expo-sqlite.ts:415` unchanged; expo-sqlite takes a file name, so the device file is literally `file:notes.db`.

Found building `examples/react-native-notes` (trails#10425), which works around it in the example; see its README row 14.

## Acceptance criteria

- The expo driver strips a `file:` URI (and its query) to the name expo-sqlite expects, or rejects it with a clear error.
- A test pins the name the driver passes for `file:x.db` and `x.db`.
