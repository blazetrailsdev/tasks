---
title: "rbAryReplace raises FrozenError on a frozen receiver (rb_ary_modify_check)"
status: draft
updated: 2026-11-05
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rbAryReplace` (`packages/ruby-compat/src/array.ts`, added by trails#9737) ports `rb_ary_replace`
(`vendor/ruby/v3.3.11/array.c:4531`) but skips its first line, `rb_ary_modify_check(copy)`, which
raises `FrozenError` ("can't modify frozen Array: ...") for a frozen receiver. ruby-compat has no
shared array modify-check helper yet.

## Acceptance criteria

- [ ] `rbAryReplace` raises `FrozenError` with MRI's message when `copy` is frozen (`Object.isFrozen`), before any mutation.
- [ ] A test covers the frozen arm.
