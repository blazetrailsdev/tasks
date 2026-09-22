---
title: "Inline or relabel invented associations helpers carrying PERMANENT receipts"
status: ready
updated: 2026-09-22
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 300
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found by the PERMANENT-receipt audit. These associations-area names score
`novel` without their receipt and are trails inventions Rails inlines or does
not have — CLAUDE.md § No extra abstraction. They are debt, so `PERMANENT` is the
wrong claim.

- `associations.ts:417` `applyAssociationScope`
- `associations/association-scope.ts:20` `invokeScopeLambda`, `:445`
  `unionOrderClauses` (prior art `union-order-clauses-is-a-second-spelling-of-ruby-array-union`, RFC 0082 draft)
- `associations/collection-association.ts:52` `syncWrite`, `:65` `syncIdsWrite`,
  `:856` `isThenable`, `:879` `includesRecord`
- `associations/has-one-association.ts:352` `sameRecord`
- `associations/builder/collection-association.ts:5` `idsName` (prior art
  `retire-ids-name-helper-constructor-dispatch`, RFC 0075 draft)
- `associations/key-normalization.ts:6,17` `normalizeAssociationKey`,
  `associationKeysEqual`
- `associations/errors.ts:384,398,411` `HasOnePersistedAssignmentError`,
  `CollectionPersistedAssignmentError`, `CollectionIdsAssignmentError` — error
  classes Rails does not raise (`associations/errors.rb`); their messages
  describe a JS `await` constraint no ratified section covers
- `association-cache.ts` (file-level PERMANENT tag, 18 names) — Rails keeps
  `@association_cache` as a plain Hash (`associations.rb`); prior art
  `b5-converge-association-cache` is `done` but the file remains
- `nested-attributes.ts:378` `assignRecords`,
  `relation/finder-methods.ts:327` `whereCompositePrimaryKeyIn` — module-private
  helpers carrying a receipt the extractor never reads (off the measured surface)

## Acceptance criteria

- Each helper is inlined back into its Rails-named caller, or its receipt is
  relabelled `CONVERGEABLE <story-id>` naming the story (existing prior art
  above, or a new one) that will remove it.
- Receipts on module-private helpers that no gate reads are deleted along with
  the helper, not left as unverified claims.
- No name in this list keeps a PERMANENT receipt.
