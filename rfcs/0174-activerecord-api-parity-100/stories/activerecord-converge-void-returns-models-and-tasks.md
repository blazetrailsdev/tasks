---
title: "activerecord: model, migration and task methods return what Rails callers read (void-returns report)"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: arms
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The non-adapter half of `pnpm parity:api:returns`' activerecord pairs:
`associations/singular-association.ts#writer`, `autosave-association.ts#build`,
`encryption/encryptable-record.ts#encrypt`/`#decrypt`, `internal-metadata.ts#createTable`/`#dropTable`,
`schema-migration.ts#createTable`/`#dropTable`, `log-subscriber.ts#sql`,
`migration/command-recorder.ts#record`, `migration/compatibility.ts#addIndex`/`#removeIndex`,
`migration.ts#validate`, `relation/query-methods.ts#buildOrder`, `schema-dumper.ts#foreignKeys`,
`tasks/database-tasks.ts#migrate`, and `create`/`establishConnection` in the three
`tasks/*-database-tasks.ts`.

## Acceptance criteria

- [ ] Each returns Rails' value; `pnpm parity:api:returns` lists no activerecord pair once `activerecord-converge-void-returns-adapters` also lands.
