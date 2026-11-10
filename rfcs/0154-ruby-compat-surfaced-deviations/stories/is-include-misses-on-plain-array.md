---
title: "is-include-misses-on-plain-array"
status: draft
updated: 2026-11-10
rfc: "0154-ruby-compat-surfaced-deviations"
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

`isInclude` (`packages/ruby-compat/lib/enumerable.ts:999`), the port of
`Enumerable#include?` (`vendor/ruby/v3.3.11/enum.c:2921` `enum_member`), answers
`false` for `isInclude(["a"], "a")`: the `rbBlockCall` it iterates through never
reaches `member_i`'s `rb_equal` hit on a plain Array receiver. Found while porting
`Mail::Matchers::HasSentEmailMatcher#matches_on_sender?` (trails#9946), which fell
back to native `Array#includes` because the elements are strings.

## Acceptance criteria

- [ ] `isInclude(["a"], "a")` is `true`, and `isInclude` on an `each` receiver still breaks on the first `rb_equal` hit.
- [ ] A ruby-compat test covers an Array receiver and an object element that defines `==`.
