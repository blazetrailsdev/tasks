---
title: "Retire AV-wrapping of current-scheme expansion candidate; converge to Rails raw-plaintext + PredicateBuilder scalar casting"
status: in-progress
updated: 2026-07-23
rfc: "0055-serialization-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 5142
claim: "2026-07-23T13:13:38Z"
assignee: "current-scheme-av-wrap-invention-retire"
blocked-by: null
closed-reason: null
---

## Context

Rails' `EncryptedQuery.all_ciphertexts_for` equivalent keeps the raw plaintext
at index 0 of the expanded IN list and relies on the PredicateBuilder
type-casting scalars through the attribute's resolved type
(vendor/rails/activerecord/lib/active_record/encryption/extended_deterministic_queries.rb:70-90 —
only PREVIOUS-scheme values are AdditionalValue-wrapped). Trails wraps the
current-scheme candidate in an AdditionalValue too
(`packages/activerecord/src/encryption/extended-deterministic-queries.ts`
allCiphertextsFor, comment documents the deviation) because plain scalars in
an IN array bypass type serialization in our PredicateBuilder. This invention
forced AV-awareness to spread beyond EncryptedAttributeType: #5135 added an
ADDITIONAL_VALUE_BRAND pass-through/unwrap to
`packages/activerecord/src/type/serialized.ts` (cast/serialize) with a
Symbol.for copy of the brand to avoid an import cycle, and
`EncryptedUniquenessValidator.allCiphertextsFor`
(`extended-deterministic-uniqueness-validator.ts`) wraps the current value the
same way. `EncryptedQuery.additionalValuesFor` (the faithful Rails port) is
dead code because the invention path replaced it.

## Acceptance criteria

- PredicateBuilder serializes plain scalar elements of an expanded IN list
  through the attribute's resolved type (matching Rails), so the
  current-scheme candidate can stay as raw plaintext at index 0.
- `allCiphertextsFor` (both files) converges to Rails: raw plaintext first,
  AdditionalValue wrapping only for previous types; dead
  `additionalValuesFor` becomes the live path or is removed with the rest.
- The AV brand handling added to `type/serialized.ts` (cast/serialize
  pass-through + Symbol.for brand copy) is deleted once no AV can reach the
  wrapper type.
- Existing extended-deterministic query/uniqueness suites and the
  Serialized(Encrypted(...)) guard in
  `extended-deterministic-queries.trails.test.ts` stay green.
