---
title: "activerecord: restore the 30 dropped Rails branches in root (report-arms missing rows)"
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
9 in 10 are real (RFC 0113's stratified read). The root pairs:

- `attribute-assignment.ts#executeCallstackForMultiparameterAttributes` — `-loop`
- `attribute-methods.ts#attributeNames` — `-if`
- `connection-handling.ts#connectingTo` — `-if`
- `core.ts#inspectWithAttributes` — `-if`
- `core.ts#isApplicationRecordClass` — `-if`
- `core.ts#findBy` — `-if`
- `core.ts#inspect` — `-if -if -if -if`
- `database-configurations.ts#buildConfigs` — `-if -if`
- `enum.ts#_enum` — `-loop -loop +if +if +if +if +if +if +if +if +if +if +if +if +if +if +if +if +if +if +if +if +if +if +if +if +if +if +if +if`
- `inheritance.ts#computeType` — `-if`
- `insert-all.ts#touchModelTimestampsUnless` — `-if`
- `log-subscriber.ts#sql` — `-if -if`
- `migration.ts#loadMigration` — `-try -rescue +if +throw`
- `model-schema.ts#resetColumnInformation` — `-loop +try +rescue`
- `nested-attributes.ts#assignNestedAttributesForCollectionAssociation` — `-if`
- `nested-attributes.ts#checkRecordLimitBang` — `-if`
- `nested-attributes.ts#callRejectIf` — `-if -if`
- `persistence.ts#updateColumns` — `-loop`
- `reflection.ts#inverseWhichUpdatesCounterCache` — `-if +try +rescue`
- `reflection.ts#sourceReflectionNames` — `-if`
- `relation.ts#isEmpty` — `-if`
- `relation.ts#updateAll` — `-if`
- `relation.ts#deleteAll` — `-if`
- `relation.ts#currentScopeRestoringBlock` — `-if`
- `relation.ts#applyJoinDependency` — `-if`
- `schema-dumper.ts#constructor` — `-try -rescue +if +if`
- `schema-dumper.ts#table` — `-loop +try +try +rescue +if +rescue +if +if`
- `test-fixtures.ts#afterTeardown` — `-try`
- `test-fixtures.ts#accessFixture` — `-if`
- `timestamp.ts#recordUpdateTimestamps` — `-if`

## Acceptance criteria

- [ ] Each pair's branches match its Rails body (CLAUDE.md § "Control flow"): same guards, order, early returns.
- [ ] The missing-direction report shows 0 activerecord rows in these files.
- [ ] Tests exercising the restored branches are ported or already green.
