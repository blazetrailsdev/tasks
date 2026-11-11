---
title: "activerecord-file-local-cycles-blocking-namespace-read-imports"
status: draft
updated: 2026-11-11
rfc: "0205-namespace-seats-are-plain-javascript"
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

trails#9979 (`activerecord-reads-whose-import-edge-reorders-the-base-cycle`) checked each AR file's deferred `ActiveRecord.X` reads, converted on their own, with a plain-node entry check over `packages/activerecord/dist`. Most files hit the Base/Relation `extends` TDZ. A smaller set adds only one or two new entry failures, from a cycle local to the file:

- `dynamic-matchers.ts:18` (`ActiveRecord.Base`): `Cannot access 'SpawnMethods'`, entry `dynamic-matchers.js`
- `relation/predicate-builder.ts:47` (`ActiveRecord.Relation`): `SpawnMethods`, entry `relation/query-methods.js`
- `relation/predicate-builder/association-query-value.ts:37,54`: `SpawnMethods`, entry `relation/query-methods.js`
- `associations/builder/has-and-belongs-to-many.ts:24` (`class extends ActiveRecord.Base`): `SpawnMethods`, entry `associations.js`
- `attribute-methods/primary-key.ts:280`: `SpawnMethods`, entry `attribute-methods/composite-primary-key.js`
- `translation.ts:8`: `Cannot access 'Translation'`, entry `translation.js`
- `associations/belongs-to-association.ts:102`: `BelongsToAssociation` (2 failures)
- `migration/command-recorder.ts` (`ActiveRecord.IrreversibleMigration`, 17 reads): `CommandRecorder`, entry `connection-adapters/abstract/schema-statements.js` (9 failures)

Rails spells each one fully qualified (`ActiveRecord::Base`, `ActiveRecord::Relation`, `ActiveRecord::IrreversibleMigration`).

## Acceptance criteria

- [ ] For each file above, trace the cycle behind the TDZ, break it by moving a module-eval edge, and convert the read to an ES import. If it can't be broken, record the cycle path in the story.
- [ ] The plain-node entry check over every `packages/activerecord/dist` module (cold build) shows no failure beyond main's.
