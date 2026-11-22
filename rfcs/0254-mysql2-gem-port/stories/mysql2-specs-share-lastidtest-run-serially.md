---
title: "mysql2 DB specs run serially like RSpec (lastIdTest race)"
status: in-progress
updated: 2026-11-22
rfc: "0254-mysql2-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: trails#10567
claim: "2026-11-22T14:54:11Z"
assignee: "mysql2-client-default-auth-reaches-the-npm-handshake"
blocked-by: null
closed-reason: null
---

## Context

`packages/mysql2/test/client.test.ts:300-310` and `packages/mysql2/test/statement.test.ts:276-305` both create and `DROP TABLE lastIdTest`, mirroring the gem's `spec/mysql2/client_spec.rb` and `spec/mysql2/statement_spec.rb`, which share the same table. RSpec runs those spec files serially in one process. Vitest runs the two files in parallel against one database, so one file's `DROP TABLE` can land in the middle of the other's inserts. Each file passes when run alone, and the race turned up while working on trails#10556.

## Acceptance criteria

- The mysql2 package's DB-backed spec files run serially against the shared database, as RSpec runs them (for example `fileParallelism: false` on the mysql2 vitest project), and the table name stays `lastIdTest` as the gem has it.
- Running `client.test.ts` and `statement.test.ts` together passes repeatedly.
