---
title: "F-6 — nested-attributes cluster"
status: done
updated: 2026-06-08
rfc: "0000-ar-test-compare-100"
cluster: clusters
deps: []
deps-rfc: []
est-loc: 200
pr: 3011
claim: "2026-06-07T22:52:40Z"
assignee: "f6-nested-attributes"
blocked-by: null
---

## Context

`nested_attributes_test.rb` (18), `nested_attributes_with_callbacks_test.rb`
(10), `forbidden_attributes_protection_test.rb` (3) are actionable now.
`associations/nested_error_test.rb` (4) is Phase-G-gated. Audit first to
identify which skips need deep `accepts_nested_attributes_for` features vs.
in-scope now.

## Acceptance criteria

- [ ] Audit identifies Phase-G-gated vs. in-scope subset.
- [ ] All in-scope nested-attributes skips (~25) un-skipped.
- [ ] Phase-G-gated cases left with updated `BLOCKED:` annotation.

## Notes

Rails: `test/cases/nested_attributes_test.rb`, `nested_attributes_with_callbacks_test.rb`,
`forbidden_attributes_protection_test.rb`.
