---
title: "activesupport: close test_case.rb and testing/time_helpers.rb API gaps"
status: claimed
updated: 2026-11-19
rfc: "0246-activesupport-parity-100"
cluster: api-residuals
packages: [activesupport]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: "2026-11-19T10:16:36Z"
assignee: "activesupport-api-parallelization-permanence"
blocked-by: null
closed-reason: null
---

## Context

`parity:api --missing`:

- `test_case.rb` (34/48): `assert_not_empty`, `assert_not_equal`,
  `assert_not_in_delta`, `assert_not_in_epsilon`, `assert_not_instance_of`,
  `assert_not_kind_of`, `assert_no_match`, `assert_not_nil`,
  `assert_not_operator`, `assert_not_predicate`, `assert_not_respond_to`,
  `assert_not_same`, `inspect`, `test`. The first twelve are the
  `alias_method :assert_not_*, :refute_*` block in `test_case.rb`, so they
  are aliases of existing minitest ports, not new behavior.
- `testing/time_helpers.rb` (15/21): `Stub`'s `object`, `method_name`,
  `original_method` and their writers. `Stub` is a `Struct.new(:object,
:method_name, :original_method)`, so these are its member accessors.

## Acceptance criteria

- [ ] Seat the 12 aliases on `TestCase` as the same function objects as
      their `refute_*` targets.
- [ ] Port `TestCase.test` and `#inspect`.
- [ ] Give `Stub` its six Struct member accessors.
- [ ] Both files reach 100% in `parity:api`.
