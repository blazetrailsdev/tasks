---
title: "type-singular-association-reader-promise-branch"
status: closed
updated: 2026-09-13
rfc: "0130-activerecord-extra-surface-receipt-burndown"
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
closed-reason: "folded into trails#7738"
---

## Context

`SingularAssociation#reader` (`packages/activerecord/src/associations/singular-association.ts:74`) returns `Base | null | Promise<Base | null>`: Rails' `reader` reloads an unloaded target in line (`activerecord/lib/active_record/associations/singular_association.rb:7-15`), which is async in trails. The generated accessor delegates to it (`associations/builder/association.rb:102`).

The declared reader types do not carry the Promise branch: the virtualizer's `renderSingularAssoc` (`packages/activerecord/src/type-virtualization/synthesize.ts:~312`) emits `Target | null`, and every hand-written `declare author: Author | null` in `src/test-helpers/models/` does the same. An un-awaited unloaded read type-checks as a record. Surfaced in review of trails#7738 (which retired `loadBelongsTo`/`loadHasOne`, the old typed load path).

## Acceptance criteria

- Singular association reader declarations (virtualizer output and test models) type the Promise branch, e.g. `Target | null | Promise<Target | null>`, or an equivalent shape that forces narrowing/awaiting on an unloaded read.
- A dx type test proves un-awaited unloaded access cannot be used as a record, and `await record.assoc` narrows to `Target | null`.
- Sync post-preload reads in the repo are adjusted accordingly.
