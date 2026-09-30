---
title: "activerecord: port i18n_validation_test.rb's 12 validates_uniqueness_of / validates_associated cases"
status: ready
updated: 2026-09-30
rfc: "0175-activerecord-test-parity-100"
cluster: missing-tests
packages: ["activerecord"]
deps:
  ["parity-100-rehome-postponed-rfc-dependencies", "i18n-validation-test-uses-ad-hoc-topic-models"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`validations/i18n_validation_test.rb` 2/14. Rails generates the missing twelve from a
`COMMON_CASES.each` loop (`vendor/rails/v8.0.2/activerecord/test/cases/validations/i18n_validation_test.rb`) over `validates_uniqueness_of` and
`validates_associated`:

- "validates_uniqueness_of on generated message given no options"
- "validates_uniqueness_of on generated message given custom message"
- "validates_uniqueness_of on generated message given if condition"
- "validates_uniqueness_of on generated message given unless condition"
- "validates_uniqueness_of on generated message given option that is not reserved"
- "validates_uniqueness_of on generated message given on condition"
- "validates_associated on generated message given no options"
- "validates_associated on generated message given custom message"
- "validates_associated on generated message given if condition"
- "validates_associated on generated message given unless condition"
- "validates_associated on generated message given option that is not reserved"
- "validates_associated on generated message given on condition"

`i18n-validation-test-uses-ad-hoc-topic-models` (RFC 0023) moves the file onto `replied_topic` first.

## Acceptance criteria

- [ ] All twelve ported under Rails' generated names with Rails' `assert_equal` on the generated message.
- [ ] `i18n_validation_test.rb` 14/14.

## Verification

```bash
pnpm parity:test --package activerecord --missing && pnpm parity:test:assertions
```
