---
title: "Port BasicObject#method_missing so a methodMissing override has a super to call"
status: draft
updated: 2026-10-05
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`MyScript#method_missing` (`vendor/thor/v1.3.2/spec/fixtures/script.thor:133-139`) calls `super`
for `:boom!`, which reaches `BasicObject#method_missing` (`rb_method_missing`,
`vendor/ruby/v3.3.11/vm_eval.c:919`) and raises `NoMethodError`.

ruby-compat has no port of it. `sendInternal` (`packages/ruby-compat/src/object.ts:809-818`)
builds the `NoMethodError` inline when a receiver has no `methodMissing`, so a class that
defines `methodMissing` has nothing to call for its `super` arm. The fixture
(`packages/trailties/src/thor/test-helpers/fixtures/script.ts`, `MyScript#methodMissing`) throws
`new NoMethodError(...)` itself, repeating that message format.

## Acceptance criteria

- [ ] ruby-compat exports the port of `rb_method_missing` (raising the `NoMethodError`
      `sendInternal` raises today), with its MRI citation and `@noRailsEquivalent PERMANENT`
      receipt, and `sendInternal` raises through it.
- [ ] `MyScript#methodMissing`'s `"boom!"` arm calls it in place of constructing the error.
