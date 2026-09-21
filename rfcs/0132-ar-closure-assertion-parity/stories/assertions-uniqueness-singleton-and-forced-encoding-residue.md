---
title: "assertions-uniqueness-singleton-and-forced-encoding-residue"
status: draft
updated: 2026-09-21
rfc: "0132-ar-closure-assertion-parity"
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

Residual assertion mismatches left after `assertions-validations-and-encryption-remainder`:

1. `validations/uniqueness_validation_test.rb:109` `validate uniqueness with singleton class` — rails 2 vs trails 1 (truthy 1 vs 0). Rails calls `t2.singleton_class.validates(:title, uniqueness: true)`, so the validator only applies to `t2` and `t3 = Topic.new` stays valid. The trails port (`packages/activerecord/src/validations/uniqueness-validation.test.ts`) validates on `Topic` itself. An anonymous `class extends Topic {}` does not work as the singleton analogue: `UniquenessValidator#findFinderClassFor` (`validations/uniqueness.ts:139`, Rails `validations/uniqueness.rb:58-68`) picks the subclass, which adds an STI `type = '...'` condition, so the duplicate is never found. Ruby's `record.class` skips the singleton class; JS has no equivalent.
2. `encryption/encryptable_record_test.rb` `forced encoding for deterministic attributes will replace invalid characters` — value mismatch `"Hello ��"` vs `"Hello ??"`. Rails passes a binary string (`"Hello \x93\xfa".b`) and relies on the default UTF-8 forced encoding to scrub invalid bytes into U+FFFD (`encryption/encryptor.rb` `force_encoding_if_needed`). trails sets ASCII and substitutes `?` (`encryption/encryptor.ts` `forceEncodingIfNeeded`, `encrypted-attribute-type.ts` `_applyForcedEncoding`).

## Acceptance criteria

- The singleton-class test mirrors Rails (t2 invalid, t3 valid), using a settled singleton-class idiom, or the story is blocked with a specific language blocker.
- The forced-encoding test uses the Rails input and expected value `"Hello ��"`.
- `pnpm parity:test -- --package activerecord --assertions --missing` reports neither row.
