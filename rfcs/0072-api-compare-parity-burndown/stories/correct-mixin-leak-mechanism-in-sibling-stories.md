---
title: "Correct the this-typed mixin premise in RFC 0072 stories derived from the top-files inventory spike"
status: closed
updated: 2026-08-02
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "docs-only: no sibling story depended on the this-typed framing; corrected the spike D4 + host-leak story mechanism and recorded the re-derived 21-key __mixin set in the story body"
---

## Context

Raised by PR #5336 (merged). The `extra-surface-mixin-pseudo-module-host-leak`
story — derived from the `extra-surface-activerecord-top-files-inventory` spike
(2026-07-25) — stated the leak mechanism as "`this`-typed mixin pseudo-modules
leak the whole host interface", i.e. that the extractor keys off a function's
`this` parameter and copies the named host interface's members.

That is not what `scripts/api-compare/extract-ts-api.ts` does. There is no
`this`-parameter handling anywhere in the extractor; the pseudo-module is
synthesized for any exported function whose RETURN type has construct
signatures, and the members copied are the returned constructor's instance
type. The `inheritance.ts` helpers matched because they return `typeof Base`,
not because they are `this`-typed. Same members, same fix — but the stated
mechanism was wrong, and `grep`ing for `this:` would have found the wrong set
of files.

Sibling RFC 0072 stories written off the same spike may carry the same
hypothesis. `triage-newly-visible-mixin-parity-gaps` (ready, est 120) and
`burn-down-mixin-driven-wide-ratchet-expansion` (ready, est 200) both scope
themselves by "mixin" and are the likely candidates; a scoping premise stated
as `this`-typed will select the wrong files.

## Acceptance criteria

- Re-read the two named stories (and any other RFC 0072 story citing the
  `extra-surface-activerecord-top-files-inventory` spike) and check whether
  their file-selection premise depends on the `this`-typed framing.
- Where it does, correct the body to the real mechanism: exported function
  whose return type has construct signatures
  (`extract-ts-api.ts`, the `getConstructSignatures()` branch).
- Re-derive any file/count lists those stories quote, since a `this:`-based
  derivation would have produced a different set. The authoritative query is
  the set of `<file>:<fn>__mixin` keys in `output/ts-api.json`.
- Docs-only outcome is a valid result if no sibling story turns out to depend
  on the wrong framing — record that finding on this story and close it.

## Findings (2026-08-02)

Docs-only outcome. **No sibling story's file selection depended on the
`this`-typed framing**, so nothing needed re-scoping; the wrong mechanism was
corrected where it is stated, and the authoritative mixin-key set is recorded
below so future readers do not re-derive it.

### The real mechanism

`scripts/api-compare/extract-ts-api.ts:691-706`: a second top-level walk visits
every exported function declaration, takes the declaration's signature return
type, and bails unless `returnType.getConstructSignatures()` is non-empty. When
it is, it keys a pseudo-module `<file>:<fnName>__mixin` and copies the
properties of `constructSigs[0].getReturnType()` — the returned constructor's
instance type. No `this`-parameter handling exists anywhere in the extractor.

### Story-by-story check

- `triage-newly-visible-mixin-parity-gaps` (ready, est 120) — **not affected.**
  Scoped to the 258 Rails-side methods made visible by PR #5334's
  `resolveModuleName` namespace-prefix walk (Ruby `include`/`extend`
  resolution). Its file selection is by Rails host + contributing Ruby module
  and never touches the TS extractor's pseudo-module path. Left unchanged.
- `burn-down-mixin-driven-wide-ratchet-expansion` (done, PR #5346) — **not
  affected**, same reason: it buckets the wide-call ratchet regeneration from
  #5334. Its "mixin" is the Ruby-side one. Left unchanged.
- `extra-surface-associations-engine-classify`,
  `extra-surface-sti-and-schema-registry-names` (both `deps:
extra-surface-mixin-pseudo-module-host-leak`) — **not affected.** They cite
  the artifact by `__mixin` key and by declaring file, which is
  mechanism-agnostic and matches the re-derivation below. Left unchanged.
- `extra-surface-mixin-pseudo-module-host-leak` (done, PR #5336) — **corrected**
  (title + mechanism paragraph + the fixture wording in its acceptance
  criteria).
- `extra-surface-activerecord-top-files-inventory` (the spike, closed) —
  **corrected**: D4's heading and summary line, plus an inline correction note,
  since ten registered stories cite this body as their source.

### Re-derived `__mixin` key set

`pnpm build && pnpm parity:api`, then the `<file>:<fn>__mixin` keys under
`packages.<pkg>.classes` in `scripts/api-compare/output/ts-api.json`
(2026-08-02, `ba674d3eb`): **21 keys in 4 packages, 12 files.**

| package          | file                                      | mixin functions                                                                                                                                  |
| ---------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| activerecord     | `inheritance.ts`                          | `baseClass`, `computeType`, `discriminateClassForRecord`, `findStiClass`, `getStiBase`, `polymorphicClassFor`, `stiClassFor`                     |
| activerecord     | `relation/delegation.ts`                  | `associationRelationClassFor`, `collectionProxyClassFor`, `disableJoinsAssociationRelationClassFor`, `relationClassFor`, `relationDelegateClass` |
| activerecord     | `adapters/postgresql/schema-ar-models.ts` | `makeSchemaThingModel`, `makeThing5Model`                                                                                                        |
| activerecord     | `store.ts`                                | `storeAccessorFor`, `storeAccessorForMethod`                                                                                                     |
| activerecord     | `associations.ts`                         | `resolveAssocClass`                                                                                                                              |
| activerecord     | `migration/compatibility.ts`              | `findVersion`                                                                                                                                    |
| activemodel      | `type/helpers/numeric.ts`                 | `applyNumericMixin`                                                                                                                              |
| activesupport    | `callbacks.ts`                            | `CallbacksMixin`                                                                                                                                 |
| actioncontroller | `metal/request-forgery-protection.ts`     | `protectionMethodClass`                                                                                                                          |

Post-#5336 this set is much smaller than the spike's (the host-leak members no
longer count as file surface), and it is broader than the spike's six
activerecord files — `store.ts`, `adapters/postgresql/schema-ar-models.ts` and
the non-activerecord entries are new to it. None of these functions is
`this`-typed.
