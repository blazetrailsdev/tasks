---
title: "assertions-validations-and-encryption-remainder"
status: done
updated: 2026-09-21
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: trails#7921
claim: "2026-09-21T01:58:41Z"
assignee: "assertions-validations-and-encryption-remainder"
blocked-by: null
closed-reason: null
---

## Context

Remainder of `assertions-validations-and-encryption` (RFC 0132). Converged in the parent PR: validations_test, numericality/presence/length/association validation, encryptor_test, scheme_test, configurable_test (unnamed-classes test). Method: `pnpm parity:test -- --package activerecord --assertions --missing`; JS kinds map via `scripts/test-compare/assertion-kinds.ts` (`assert_predicate`→`toBeTruthy`, `assert_empty`→`assertEmpty` from activesupport, `assert_raise`→`rejects.toThrow`, unmapped rails helpers e.g. `assert_encrypt_text`→ a local `assert*` helper counts as one unmapped).

Remaining (re-measured):

- `validations/uniqueness_validation_test.rb` (31 tests) — trails `validations/uniqueness-validation.test.ts`. Missing `assert_empty` (assertEmpty), `assert_not_equal`, `assert_nothing_raised`, `assert_match`, `assert_changes`; count gaps in case-(in)sensitive, collation, limit, straight inheritance, uuid, without primary key.
- `encryption/encryptable_record_test.rb` (40 tests, incl. encryptable_record_api_test) — trails `encryption/encryptable-record.test.ts`; counts diverge (e.g. "ignores empty values" rails 1 vs trails 4).
- `encryption/configurable_test.rb` `.configure configures initial config properties` — equal rails 4 vs trails 3, match 0 vs 1.

## Acceptance criteria

Each listed file reports 0 count/kind/value mismatches; do not touch the frozen mark file.
