---
title: "activerecord: port 'disconnect and recover on #configure_connection timeout'"
status: draft
updated: 2026-11-25
rfc: "0189-activerecord-surfaced-deviations"
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

`vendor/rails/v8.0.5.2/activerecord/test/cases/adapter_test.rb:873-893`, "disconnect and recover on #configure_connection timeout", is the one activerecord test that still has no port after trails#10718. A singleton `configure_connection` sleeps 5s. `Timeout.timeout(0.2) { connection.exec_query("SELECT 1") }` is expected to raise `Timeout::Error`. The connection must then recover: `exec_query("SELECT 1").rows == [[1]]` with no failures.

Ruby's `Timeout.timeout` interrupts the running block, which leaves the adapter half-configured. Recovery then goes through `reconnect!` / `verify!`. A JS timeout can race the block's promise, but it cannot stop the body, and the slow `configure_connection` keeps running.

## Acceptance criteria

- Converge toward Rails: port the test under its Rails name, with a timeout that rejects while `configure_connection` is pending. The next `execQuery` must then see the connection as not fully connected and reconfigure it, as `connect!` / `configure_connection` ordering does in `abstract_adapter.rb`.
- If no shape can model the interrupt, get an operator ruling. Only then park the test as `it.skip` under a `PERMANENT-SKIP:` line citing that ruling.
