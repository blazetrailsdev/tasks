---
title: "sqlite3: Database#busy_handler has no npm client counterpart; record or resolve the retries gap"
status: done
updated: 2026-11-21
rfc: "0187-sqlite3-gem-port"
cluster: drivers
packages: ["sqlite3", "activerecord"]
deps: ["sqlite3-database-class-carries-the-gem-surface"]
deps-rfc: []
est-loc: 150
priority: null
pr: trails#10514
claim: "2026-11-21T18:55:37Z"
assignee: "sqlite3-better-sqlite3-engine"
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
- [ ] Per RFC 0187-sqlite3-gem-port open question 2's answer (operator, 2026-11-21: the retry loop), each engine runs the busy handler between attempts on `SQLITE_BUSY`, stopping when it answers `false`, under a `@noRailsEquivalent PERMANENT` receipt naming it as behaviour the client lacks.
- [ ] The `retries` config is not silently ignored in either case; a test pins what happens.
