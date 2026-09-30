---
title: "activerecord: restore the 24 dropped Rails branches in subsystems (report-arms missing rows)"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: arms
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:arms:report --package=activerecord --direction=missing` (RFC 0113; `if`/`loop`/`try`/
`rescue` are report-only, only `throw` is gated). A missing arm is a Rails branch the port does not take —
9 in 10 are real (RFC 0113's stratified read). The subsystems pairs:

- `attribute-methods/primary-key.ts#isCompositePrimaryKey` — `-if`
- `attribute-methods/time-zone-conversion.ts#cast` — `-try -rescue +if +if +if +if +if +if`
- `database-configurations/connection-url-resolver.ts#resolvedAdapter` — `-if`
- `encryption/cipher.ts#encrypt` — `-if`
- `encryption/contexts.ts#withEncryptionContext` — `-loop +rescue +throw +if +throw`
- `encryption/encryptable-record.ts#globalPreviousSchemesFor` — `-if`
- `encryption/encrypted-attribute-type.ts#previousSchemesIncludingCleanText` — `-if`
- `encryption/scheme.ts#isSupportUnencryptedData` — `-if`
- `fixture-set/table-row.ts#addJoinRecords` — `-loop +if`
- `locking/optimistic.ts#_updateRow` — `-if`
- `middleware/database-selector/resolver/session.ts#convertTimestampToTime` — `-if`
- `scoping/named.ts#defaultExtensions` — `-if`
- `scoping/named.ts#scope` — `-if`
- `tasks/database-tasks.ts#create` — `-rescue +if`
- `tasks/database-tasks.ts#raiseForMultiDb` — `-loop`
- `tasks/database-tasks.ts#drop` — `-rescue +if`
- `tasks/database-tasks.ts#dumpSchema` — `-if`
- `tasks/database-tasks.ts#classForAdapter` — `-loop +if`
- `tasks/mysql-database-tasks.ts#structureDump` — `-loop -loop -loop -loop +if +if`
- `tasks/postgresql-database-tasks.ts#structureDump` — `-loop +if +if +if`
- `testing/query-assertions.ts#assertQueriesCount` — `-if`
- `type-caster/connection.ts#typeForAttribute` — `-if`
- `type/adapter-specific-registry.ts#register` — `-if -if`
- `type/type-map.ts#performFetch` — `-loop +if +if`

## Acceptance criteria

- [ ] Each pair's branches match its Rails body (CLAUDE.md § "Control flow"): same guards, order, early returns.
- [ ] The missing-direction report shows 0 activerecord rows in these files.
- [ ] Tests exercising the restored branches are ported or already green.
