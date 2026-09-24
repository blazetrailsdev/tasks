---
title: "naming-enroll-activerecord"
status: draft
updated: 2026-09-24
rfc: "0153-naming-residue-ratchet-and-burndown"
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

Split from `naming-burndown-activerecord-behavioral`. That story's PR converged activerecord's six behavior-change naming rows. It could not add `activerecord` to `NAMING_ENROLLED_PACKAGES` (`scripts/api-compare/lint-call-args.ts:101`), because two of its deps are still open. With activerecord enrolled on that branch, `pnpm parity:api:calls:args` reports 8 `unreceipted` rows, and every one belongs to a dep:

- `missing-rails-name-receipt-on-mixin-object-function-unmatched`: the receipted rows whose receipts do not register. They are `connection-adapters/abstract/connection-pool/queue.ts` `withABiasFor` `new` (`lock`, `cond`), `connection-adapters/abstract/database-statements.ts` `truncate` `execute` (`buildTruncateStatement`) and `addTransactionRecord` `add_record` (`ensureFinalize`), and `core.ts` `isFrozen` `frozen?` (`attributes`).
- `call-args-receiver-as-argument-local-and-core-ext`: `relation.ts` `toSql` `to_sql` (`relation`) and `relation/finder-methods.ts` `raiseRecordNotFoundExceptionBang` `pluralize` (`size`). A third row has the same local-receiver shape but is not named in that story: `scoping/default.ts` `buildDefaultScope` `scope` (`scopeObj`). Rails' `scope_obj.scope` (`scoping/default.rb:161`) records the block-local receiver as `scope(ref:scopeObj)`, while TS `scopeObj.scope(combinedScope)` records `(ref:combinedScope)`.

## Acceptance criteria

- [ ] `activerecord` is added to `NAMING_ENROLLED_PACKAGES`, and `pnpm parity:api:calls:args` is green with it enrolled.
- [ ] The `scoping/default.ts` `buildDefaultScope` `scope` row re-measures as matched or as a permanent class. It is covered by the receiver-recorder fix, not receipted.
- [ ] No row is receipted to get green.
