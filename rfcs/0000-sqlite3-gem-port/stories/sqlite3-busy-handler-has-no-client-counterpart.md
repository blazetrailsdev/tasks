---
title: "sqlite3: Database#busy_handler has no npm client counterpart; record or resolve the retries gap"
status: draft
updated: 2026-10-08
rfc: "0000-sqlite3-gem-port"
cluster: drivers
packages: ["sqlite3", "activerecord"]
deps: ["sqlite3-database-class-carries-the-gem-surface"]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:829-833`:

    if @config[:retries]
      retries = self.class.type_cast_config_to_integer(@config[:retries])
      raw_connection.busy_handler { |count| count <= retries }
    end

`busy_handler` is C (`vendor/sqlite3/v2.6.0/ext/sqlite3/database.c:983`, `sqlite3_busy_handler`). None of
better-sqlite3, libsql, `node:sqlite`, expo-sqlite or sql.js exposes it. This is a new gap, not
covered by an existing story (searched: `tasks list | grep -i "busy\|retries"`).

## Acceptance criteria

- [ ] For each of the six clients, the PR body cites the source line showing `sqlite3_busy_handler` is not reachable (as `better-sqlite3-driver-ignores-strict-false` cites `deps/defines.gypi:17`).
- [ ] Then exactly RFC 0000-sqlite3-gem-port open question 2's answer: either the engines raise `SQLite3::NotSupportedException`-equivalent from `busyHandler` and this story is `tasks block`ed on upstream after filing nothing further, or a retry loop is implemented in the engine with a receipt naming it as behaviour the client lacks.
- [ ] The `retries` config is not silently ignored in either case; a test pins what happens.
