---
title: "PG translate_exception: no-connection errors raise ConnectionNotEstablished"
status: claimed
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-09-25T01:44:13Z"
assignee: "nested-through-polymorphic-accessor-fidelity"
blocked-by: null
closed-reason: null
---

## Context

`postgresql-adapter.test.ts` "translate no connection exception to not established" asserts `ConnectionFailed`, where Rails `postgresql_adapter_test.rb` (`test_translate_no_connection_exception_to_not_established`) asserts `ActiveRecord::ConnectionNotEstablished`.

Rails `postgresql_adapter.rb:800-815` (`translate_exception`): a nil-SQLSTATE error matching `/connection is closed/i` or `/no connection to the server/i` becomes `ConnectionNotEstablished`; a `PG::ConnectionBad` becomes `ConnectionFailed` only when its message ends with "\n" (libpq-originated), else `ConnectionNotEstablished`. trails' `translateException` (`postgresql-adapter.ts` ~:1836, :869) yields `ConnectionFailed` for the terminated-backend case.

## Acceptance criteria

- The translate/`ConnectionBad` branch mirrors the Rails arms, including the trailing-newline split.
- The test asserts `ConnectionNotEstablished` like Rails.
