---
title: "PG translate_exception: no-connection errors raise ConnectionNotEstablished"
status: blocked
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8075
claim: "2026-09-25T01:44:13Z"
assignee: "nested-through-polymorphic-accessor-fidelity"
blocked-by: "node-pg has no counterpart to libpq's post-send_query CONNECTION_BAD state: after pg_terminate_backend the idle client marks itself unqueryable, so the FIRST query and every later one get the same 'Client has encountered a connection error and is not queryable' (pg/lib/client.js:676-680). Rails maps the first (libpq 'server closed the connection unexpectedly\\n') to ConnectionFailed and adapter_test.rb's remote-disconnect tests depend on it; mapping that message to ConnectionNotEstablished reds 4 adapter.test.ts tests on PG (trails#8075 CI). translate_exception's arms are restructured to Rails' shape in trails#8075; the NotEstablished assertion needs a driver-level signal node-pg does not expose."
closed-reason: null
---

## Context

`postgresql-adapter.test.ts` "translate no connection exception to not established" asserts `ConnectionFailed`, where Rails `postgresql_adapter_test.rb` (`test_translate_no_connection_exception_to_not_established`) asserts `ActiveRecord::ConnectionNotEstablished`.

Rails `postgresql_adapter.rb:800-815` (`translate_exception`): a nil-SQLSTATE error matching `/connection is closed/i` or `/no connection to the server/i` becomes `ConnectionNotEstablished`; a `PG::ConnectionBad` becomes `ConnectionFailed` only when its message ends with "\n" (libpq-originated), else `ConnectionNotEstablished`. trails' `translateException` (`postgresql-adapter.ts` ~:1836, :869) yields `ConnectionFailed` for the terminated-backend case.

## Acceptance criteria

- The translate/`ConnectionBad` branch mirrors the Rails arms, including the trailing-newline split.
- The test asserts `ConnectionNotEstablished` like Rails.
