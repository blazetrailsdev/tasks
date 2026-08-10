---
title: "Assign global previous schemes eagerly at encrypts time, retiring the lazy injection point and restoring Rails' memos"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6126
claim: "2026-08-05T12:15:04Z"
assignee: "datetime-new-start-preserves-the-receiver"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/encryption/encrypted-attribute-type.ts:18-23` carries
a module-level `_globalPreviousSchemesFn`, installed by
`encryptable-record.ts:47` via the exported `setGlobalPreviousSchemesFn`, and
read at **type-read time** by `_effectivePreviousSchemes()` (:177-183). It is a
trails invention with no Rails counterpart, kept as a cycle-breaker
(encryptable-record -> encrypted-attribute-type -> encryptable-record).

Rails does not resolve globals lazily. `EncryptableRecord.scheme_for` assigns
them **eagerly, once, at `encrypts` declaration time**:

    scheme.previous_schemes = global_previous_schemes_for(scheme) +
      Array.wrap(previous).collect { |c| Scheme.new(**c) }

(`vendor/rails/activerecord/lib/active_record/encryption/encryptable_record.rb:70-81`).
So `previous_schemes` (the `delegate ... to: :scheme` at
`encrypted_attribute_type.rb:15`) is frozen by construction, which is what lets
Rails memoize freely.

This cost us real fidelity in PR #6116
(`remove-encrypted-attribute-type-previous-types-memo`): because trails'
schemes are NOT immutable, we had to **delete** the three memos Rails does have
and recompute per call —

- `previous_types` memoized on `support_unencrypted_data?`
  (`encrypted_attribute_type.rb:56-59`)
- `previous_types_without_clean_text` `||=` (`:70-71`)
- `serialize_with_oldest?` `||=` (`:122-123`)

— since any `||=` would pin a pre-`configure` answer. The deviation is
documented at the call site (JSDoc on `previousTypes`), but it is debt, not a
settled decision.

Two further sites inherit the same root cause: `previousSchemesIncludingCleanText`
(:186-190) and `previousTypesWithoutCleanText` (:193-195) call
`_effectivePreviousSchemes()` where Rails calls the plain `previous_schemes`
delegate (`:66-67`, `:70-71`).

## Converged shape

Assign the global previous schemes eagerly in `encryptAttribute`/`schemeFor`
(`encryptable-record.ts`), mirroring `encryptable_record.rb:70-81`, so
`scheme.previousSchemes` already carries them. Then:

- delete `setGlobalPreviousSchemesFn` and `_globalPreviousSchemesFn` (extra
  surface, `pnpm parity:api:extra`);
- delete `_effectivePreviousSchemes()` and route `previousSchemesIncludingCleanText`
  / `previousTypesWithoutCleanText` through the `previousSchemes` delegate, as
  `encrypted_attribute_type.rb:66-71` does;
- restore Rails' three memos verbatim (`@previous_types` hash keyed on
  `support_unencrypted_data?`, plus the two `||=`), and drop the JSDoc
  deviation note on `previousTypes`.

The cycle-breaking is the real work: find the import shape that lets
`encryptable-record.ts` own the assignment without the circular import the
injection point exists to dodge.

## Acceptance criteria

- [ ] `setGlobalPreviousSchemesFn` / `_globalPreviousSchemesFn` /
      `_effectivePreviousSchemes` are gone.
- [ ] `scheme.previousSchemes` carries the global schemes from declaration time.
- [ ] The three Rails memos are restored with Rails' keys.
- [ ] `encryption-schemes.test.ts`'s global-previous-schemes cases stay green on
      all three lanes, including any that `configure` after `encrypts()`.
