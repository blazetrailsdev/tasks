---
title: "pg-inspect-for-coder-connection-and-result"
status: ready
updated: 2026-11-23
rfc: "0186-pg-gem-port"
cluster: "result-and-coders"
packages:
  - "pg"
deps:
  - "pg-coder-dup-and-composite-dimensions"
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# pg: port inspect on Coder, CompositeCoder, Connection and Result

## Context

RFC 0186 reopened 2026-11-23 for 100% scored `pg` parity. Four Ruby `inspect` bodies are
missing:

- `PG::Coder#inspect` (`vendor/pg/v1.6.2/lib/pg/coder.rb:51-58`) and its `inspect_short` (`:60`)
- `PG::CompositeCoder#inspect` (`coder.rb:84-88`), which appends `elements_type`, quotation and `dimensions` (needs `pg-coder-dup-and-composite-dimensions`)
- `PG::Connection#inspect` (`vendor/pg/v1.6.2/lib/pg/connection.rb:100-119`): host, port and user of a fresh connection; finished, status, pipeline, transaction, nonblocking, encoding and type-map details
- `PG::Result#inspect` (`vendor/pg/v1.6.2/lib/pg/result.rb:32-40`)

Ruby's `inspect` ports at the Rails name and goes through `rbInspect` as other ruby-compat
classes do.

## Acceptance criteria

- The four `inspect` methods match the Ruby output strings.
- Port `connection_spec.rb`'s "should print host, port and user of a fresh connection, but not more" and the "should tell about ..." group that the engine can reproduce.
- `pnpm parity:api --package pg` shows the four matched.
