---
title: "strSlice accepts a number | Range | RegExp index; String#at drops its cast"
status: draft
updated: 2026-11-16
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`String#at` (`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/string/access.rb`) is `self[position]`. `packages/activesupport/lib/string-utils.ts` `at` calls `strSlice(str, position as number)` with `position: number | Range | RegExp`. It needs the cast because `strSlice` (`packages/ruby-compat/lib/string/slice.ts`) types its rest arguments as a union of tuples, so one call cannot forward the union. The cast hides the Range and RegExp arms from the type checker.

## Acceptance criteria

- [ ] `strSlice` accepts a single `number | Range | RegExp` index argument, through an overload or a widened first tuple. This is Ruby's `rb_str_aref` taking any index.
- [ ] `at` drops the cast.
