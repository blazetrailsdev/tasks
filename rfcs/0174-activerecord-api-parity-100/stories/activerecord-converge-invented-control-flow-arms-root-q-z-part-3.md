---
title: "activerecord: remove or credit the 63 invented branches in root-q-z part 3"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: arms
packages: ["activerecord"]
deps: ["activerecord-converge-missing-control-flow-arms-root"]
deps-rfc: []
est-loc: 458
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:arms:report --package=activerecord --direction=invented` — branches the TS body takes
that Rails' does not. RFC 0113 measured the `if` token ~70% non-real at repo scale (type narrowing,
`?.`, argument normalisation), so each row is either a real invented guard to delete (CLAUDE.md
§ "No extra abstraction", § "Control flow") or an extractor false positive to fix with a test:

- `schema-dumper.ts#foreignKeys` — `+loop +if +if +if`
- `schema-dumper.ts#formatOptions` — `+if +if`
- `schema-dumper.ts#removePrefixAndSuffix` — `+if`
- `schema-dumper.ts#isIgnored` — `+if`
- `schema-migration.ts#normalizeMigrationNumber` — `+if`
- `schema-migration.ts#integerVersions` — `+if`
- `schema.ts#get` — `+if +if`
- `secure-token.ts#hasSecureToken` — `+if`
- `signed-id.ts#signedId` — `+if +if`
- `signed-id.ts#signedIdVerifier` — `+if`
- `signed-id.ts#combineSignedIdPurposes` — `+if`
- `statement-cache.ts#execute` — `+throw`
- `statement-cache.ts#create` — `+if +if`
- `statement-cache.ts#unsupportedValue` — `+if +if +if +if +if +if`
- `store.ts#load` — `+if`
- `store.ts#storedAttributes` — `+loop`
- `table-metadata.ts#hasColumn` — `+if`
- `table-metadata.ts#isAssociatedWith` — `+if`
- `table-metadata.ts#associatedTable` — `+if`
- `table-metadata.ts#predicateBuilder` — `+if +if`
- `test-databases.ts#createAndLoadSchema` — `+try +if`
- `test-fixtures.ts#teardownTransactionalFixtures` — `+if +throw`
- `timestamp.ts#timestampAttributesForCreateInModel` — `+if +if`
- `timestamp.ts#timestampAttributesForUpdateInModel` — `+if +if`
- `timestamp.ts#allTimestampAttributesInModel` — `+if`
- `timestamp.ts#currentTimeFromProperTimezone` — `+if`
- `timestamp.ts#maxUpdatedColumnTimestamp` — `+if`
- `timestamp.ts#timestampAttributesForCreateInModel` — `+if +if`
- `timestamp.ts#timestampAttributesForUpdateInModel` — `+if +if`
- `timestamp.ts#allTimestampAttributesInModel` — `+if`
- `token-for.ts#payloadFor` — `+if +if`
- `token-for.ts#resolveToken` — `+if`
- `relation.ts#findByTokenForBang` — `+if`
- `touch-later.ts#touchLater` — `+loop +if +if`
- `touch-later.ts#surreptitiouslyTouch` — `+if +if`
- `transaction.ts#uuid` — `+if`
- `validations.ts#isValid` — `+if +throw +try`
- `validations.ts#performValidations` — `+if`

## Acceptance criteria

- [ ] Every real invented guard is removed so the body matches Rails' control flow.
- [ ] Every false positive is fixed in `scripts/api-compare/` (skeleton extraction) with a unit test, not by editing the port; the fix's effect on the other packages is recorded in the PR body.
- [ ] The invented-direction report shows 0 activerecord rows in these files.
