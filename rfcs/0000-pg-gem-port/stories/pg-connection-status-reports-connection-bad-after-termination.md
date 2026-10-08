---
title: "pg: retest what a query raises after backend termination, against the wrapper"
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

Rails does not read `status` here. `translate_exception`'s nil-SQLSTATE arm
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:804-821`)
is: a message matching `/connection is closed/i` or `/no connection to the server/i` is
`ConnectionNotEstablished`; otherwise a `PG::ConnectionBad` whose message ends in a newline (libpq's
own message style, so the failure may have followed a send) is `ConnectionFailed`, and one that
does not (the pg gem's internal check, so nothing was sent) is `ConnectionNotEstablished`.

So what Rails needs from the driver is two distinguishable errors: libpq's on the first query
after the backend dies, and "no connection to the server" style on every query after that. The
state behind that sequence is libpq's `CONNECTION_BAD`, which `status`
(`vendor/pg/v1.5.9/ext/pg_connection.c:4518`) reports. Once the wrapper owns the socket listeners
and raises `PG::ConnectionBad` itself, both are the wrapper's to define. This story finds out
whether it can hold libpq's sequencing.

## Acceptance criteria

- [ ] A `packages/pg` test terminates the backend (`pg_terminate_backend`) under an idle connection and records what `status()` answers before the next query, the class and exact message the next query raises, the class and exact message of the query after that, and what `status()` answers at each point, against what libpq does (run the same sequence in `ruby` with the `pg` gem if it is installed; `ruby` is on PATH).
- [ ] If the wrapper can match libpq (the first failed send raises libpq's newline-terminated message and flips `status()` to `CONNECTION_BAD`; later sends raise the no-connection message), it does, and the blocked story's two Rails tests are un-skipped and green; the PR body names the unblock verb.
- [ ] If it cannot, the PR adds no behaviour: it appends the exact finding to the blocked story's notes (a markdown edit) and this story is closed with that reason. Do not emulate a state the client does not have.

## Verification

```bash
pnpm vitest run packages/pg
```
