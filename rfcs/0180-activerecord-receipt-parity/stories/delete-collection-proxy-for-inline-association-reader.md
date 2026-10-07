---
title: "activerecord: delete collectionProxyFor; callers read association(name).reader inline"
status: ready
updated: 2026-10-07
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: []
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

`collectionProxyFor(record, assocName)` (`packages/activerecord/src/associations.ts`,
exported from `index.ts`) is `record.association(assocName).reader` plus a
singular-reflection guard. Rails has no such function: every Rails caller spells
`association(name).reader` inline — e.g. `ActiveRecord::Associations#association`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations.rb:44-58`) and the
generated reader `association(:name).reader`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/builder/association.rb:103-107`).

It was renamed from a second exported `association()` by #7763
(`disambiguate-association-vs-collection-proxy-accessor`), which left it carrying a
`@noRailsEquivalent CONVERGEABLE` receipt. The remaining convergence is deleting it.

Callers: src — `counter-cache.ts:56`, `nested-attributes.ts:395`,
`associations/has-many-through-association.ts:451`,
`test-helpers/models/invoice.ts`; tests — ~37 files importing it as
`collectionProxyFor as association` (~400 call sites).

## Acceptance criteria

- [ ] Every caller reads `record.association(name).reader` (or the generated
      accessor, e.g. `post.comments`) instead.
- [ ] `collectionProxyFor` and its `index.ts` export are deleted, with its
      `@noRailsEquivalent` receipt.
- [ ] `pnpm parity:api:extra:gate` green; association suites green on all lanes.
