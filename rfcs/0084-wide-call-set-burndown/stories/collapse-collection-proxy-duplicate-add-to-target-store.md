---
title: "Collapse CollectionProxy's duplicate replace_on_target/add_to_target store onto CollectionAssociation"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 6426
claim: "2026-08-12T16:56:49Z"
assignee: "converge-pool-config-primary-class-name-substitution"
blocked-by: null
closed-reason: null
---

## Context

Rails has ONE `replace_on_target` /`add_to_target` store, on
`CollectionAssociation`
(`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:281-283`
and `:457-489`). trails has TWO structurally-duplicated implementations of it:

- `packages/activerecord/src/associations/collection-association.ts` —
  `addToTarget` and `replaceOnTarget`, converged to Rails' single-method shape
  (including the `inversing` kwarg) by PR #6417.
- `packages/activerecord/src/associations/collection-proxy.ts` —
  `_addToTarget`, `_replaceOnTarget`, `_targetReplaceIndex`, `_commitToTarget`
  and `_indexInTarget`, which re-spell the same Rails lines over the proxy's own
  `_target` / `_replacedOrAddedTargets` fields.

The proxy copy is the one that actually runs for has_many reads and writes
(`Base#_associationCache` surfaces `CollectionProxy#_target` as the canonical
store), so every fix has to be made twice and can silently diverge. PR #6417 hit
this directly: the `inversing:` kwarg was missing from the
`collection-association.ts` copy, but the bug was unreachable because the proxy
copy had hardcoded the same behaviour inline — which is why the regression test
filed with that story could only be a lock, not a red-on-baseline reproduction.

None of `_targetReplaceIndex` / `_commitToTarget` / `_indexInTarget` exists in
Rails; they are the proxy's private split of `replace_on_target`'s body, the
same split `collection-association.ts` just removed.

## Acceptance criteria

1. One implementation of `replace_on_target` / `add_to_target` remains, on
   `CollectionAssociation`, at the Rails names and with Rails' decomposition
   (one Rails method = one TS method).
2. `CollectionProxy`'s `_replaceOnTarget`, `_targetReplaceIndex`,
   `_commitToTarget` and `_indexInTarget` are deleted; its callers
   (`addExistingRecord`, `_replaceCommonRecordsInMemory`, `_wireInverseTarget`,
   `create`/`createBang`) reach the association's method.
3. The proxy's `_target` / `_replacedOrAddedTargets` and the association's
   `target` / `_replacedOrAddedTargets` are not two separate stores of the same
   Rails `@target` / `@replaced_or_added_targets`.
4. `packages/activerecord/src/associations/` stays green, including
   `replace-on-target-inversing.trails.test.ts` and
   `persistence-save-block.trails.test.ts`.

Likely needs splitting across PRs; size the first slice to the LOC ceiling and
file the rest.
