---
title: "trailties-port-application-initializers-frameworks-tests-remaining"
status: ready
updated: 2026-11-09
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/test/application/initializers/frameworks_test.rb` has 30 tests;
`packages/trailties/src/application/initializers/frameworks.test.ts` ports 6 (AD section, AR
table_name_prefix, unhealthy database, connections returned to the pool). The rest remain:
AC & AM (`:21-161`, needs ActionMailer view paths/default_url_options, include_all_helpers,
api_only via rack-test), AS bare (`:186-201`, `use_frameworks`), AR schema cache dump tests
(`:229-341`, needs `db:schema:cache:dump`), establish_connection/DATABASE_URL (`:343-374`),
Current scopes reset on reloading (`:385-410`), encrypted filter params (`:412-430`),
MessagePack cache serializer (`:432-445`), "database middleware doesn't initialize..." (`:209-213`).

## Acceptance criteria

- Port the remaining tests with names verbatim onto the `FrameworksTest` harness, as many as
  fit the ceiling; a test blocked on an unported surface is `it.skip` with `// BLOCKED: <story>`
  and that story is filed.
