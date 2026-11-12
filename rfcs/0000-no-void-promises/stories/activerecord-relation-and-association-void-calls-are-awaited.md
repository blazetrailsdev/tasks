---
title: "ActiveRecord relations, associations, model schema and test helpers stop dropping promises"
status: draft
updated: 2026-11-12
rfc: "0000-no-void-promises"
cluster: discarded-calls
packages: [activerecord]
deps: [no-floating-promises-repo-wide-ignore-void-false, no-swallowed-rejection-lint-rule]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § Design 3. `relation.ts:498,516`, `relation/batches.ts:214`,
`relation/delegation.ts:126`,
`relation/predicate-builder/relation-handler.ts:47`,
`relation/query-attribute.ts:42,83`, `associations/association.ts:380`,
`associations/collection-association.ts:52,521`,
`associations/has-many-through-association.ts:176`,
`associations/join-dependency/join-association.ts:138`, `base.ts:2497`,
`cases/json-shared-test-cases.ts:40`,
`test-helpers/fixtures-registry.ts:624`, `test-helpers/migration-helper.ts:73`,
`test-helpers/models/{bird,company,face}.ts`. Some operands are not promises
(`query-attribute.ts:42` reads a getter); those drop the `void`.

## Acceptance criteria

- [ ] No site above voids or empty-catches a promise; each awaits, returns or drops a non-promise `void`.
- [ ] activerecord's `floating` and `swallowed` source marks drop by exactly the sites listed above, tightened in the PR.

## Definition of done

An `eslint-disable`, a receipt tag, or a raised mark does not close this story.
