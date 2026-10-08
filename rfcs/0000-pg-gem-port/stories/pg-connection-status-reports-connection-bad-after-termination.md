---
title: "pg: retest CONNECTION_BAD after backend termination against the wrapper"
status: draft
updated: 2026-10-08
rfc: "0000-pg-gem-port"
cluster: connection
packages: ["pg", "activerecord"]
deps:
  ["pg-connection-status-cancel-block-move-to-the-package", "pg-errors-carry-result-and-connection"]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pg-translate-no-connection-raises-not-established` (RFC 0123, blocked) records: "node-pg has no
counterpart to libpq's post-send_query CONNECTION_BAD state: after pg_terminate_backend the idle
client marks itself unqueryable, so the FIRST query and every later one get the same 'Client has
encountered a connection error and is not queryable'".

Rails distinguishes them at `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:806-812`: a nil SQLSTATE on a
`PG::ConnectionBad` with `@raw_connection.status == PG::CONNECTION_BAD` is
`ConnectionNotEstablished`, otherwise `ConnectionFailed`. libpq's `status` (`vendor/pg/v1.5.9/ext/pg_connection.c:4518`)
flips to `CONNECTION_BAD` only after a send fails.

Once the wrapper owns the socket listeners, `status()` is the wrapper's to define. This story
finds out whether it can hold libpq's sequencing.

## Acceptance criteria

- [ ] A `packages/pg` test terminates the backend (`pg_terminate_backend`) under an idle connection and records what `status()` answers before the next query, what the next query raises, and what `status()` answers after, against what libpq does (run the same sequence in `ruby` with the `pg` gem if it is installed; `ruby` is on PATH).
- [ ] If the wrapper can match libpq (track the socket `error` / `end` events without flipping `status()` until a send fails), it does, and the blocked story's two Rails tests are un-skipped and green; the PR body names the unblock verb.
- [ ] If it cannot, the PR adds no behaviour: it appends the exact finding to the blocked story's notes (a markdown edit) and this story is closed with that reason. Do not emulate a state the client does not have.

## Verification

```bash
pnpm vitest run packages/pg
```
