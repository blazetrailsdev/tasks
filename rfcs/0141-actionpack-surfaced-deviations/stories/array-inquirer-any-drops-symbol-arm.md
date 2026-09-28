---
title: "array-inquirer-any-drops-symbol-arm"
status: draft
updated: 2026-09-28
rfc: "0141-actionpack-surfaced-deviations"
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

Rails' `ArrayInquirer#any?` (`vendor/rails/v8.0.2/activesupport/lib/active_support/array_inquirer.rb`) checks each candidate in both its Symbol and String forms: `include?(candidate.to_sym) || include?(candidate.to_s)`. trails' `packages/activesupport/src/array-inquirer.ts` `any` checks only `includes(candidate)`, so the Symbol arm is missing.

A Ruby Symbol is spelled `":name"` in trails. `request.variant` holds Symbols (`":phone"`): the lookup context's `variants` detail and `VariantCollector` (trails#8239) both key them that way. So `request.variant.phone?` answers false for `request.variant = ":phone"`, where Rails answers true.

## Acceptance criteria

- `ArrayInquirer#any` checks the candidate's Symbol form (`":name"`) and its String form (`"name"`), in Rails' order.
- A test ports `activesupport/test/array_inquirer_test.rb`'s symbol/string mixed cases, if they are not already ported.
- `request.variant = ":phone"; request.variant.phone?` answers true.
