---
title: "ar-type-remaining-src-part-3: encryptable-record, transactions and the rest"
status: draft
updated: 2026-10-20
rfc: "0198-activerecord-mixin-host-typing"
cluster: null
packages: ["activerecord"]
deps: []
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

`ar-type-remaining-src-part-2` (trails#9140) took the uncovered activerecord src count from 413 to 372, using the RFC regex over non-test files outside the cluster stories. Two files were left, for the reasons in the story:

- `encryption/encryptable-record.ts` (21 lines). A narrow `EncryptableRecordClass` / `EncryptableRecordHost` was tried. It rejects the bare-ActiveModel mock hosts in `encryptable-record.trails.test.ts:343-374`, `configurable.test.ts:74-138` and `configurable.trails.test.ts:162`, which lack `columnsHash`, `columnNames`, `typeForAttribute`, `decorateAttributes` and `generatedAttributeMethods`.
- `transactions.ts` (19 lines). `_committedAlreadyCalled`, `_triggerUpdateCallback`, `_triggerDestroyCallback` and `_newRecordBeforeLastCommit` are both ivars and same-named functions mixed into `Base` (`base.ts:2421-2424`), so the ivar reads cannot be typed off `Base`.

Others remain too: `connection-adapters/postgresql-adapter.ts` 18, `encryption/test-helpers.ts` 16, `associations.ts` 14, `relation/delegation.ts` 11.

## Acceptance criteria

- [ ] `encryptable-record.ts` hosts are typed after the mocks are moved onto canonical models, or onto a canonical model class carrying the schema readers.
- [ ] The `transactions.ts` ivar/function name clash is resolved by typing the ivars on a host that omits those `Base` members. Typing only, no runtime change.
- [ ] The uncovered count drops by at least another 30 lines. Typing only; `pnpm typecheck` and `parity:api:extra:gate` stay green.
