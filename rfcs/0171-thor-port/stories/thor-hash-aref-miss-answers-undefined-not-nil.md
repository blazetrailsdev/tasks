---
title: "thor-hash-aref-miss-answers-undefined-not-nil"
status: closed
updated: 2026-10-30
rfc: "0171-thor-port"
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
closed-reason: "FALSIFIED: hashAref (ruby-compat Hash#[]) already answers nil on a miss and reads the key over a colliding Hash method; the thor fixtures now use it (trails#9470)."
---

## Context

`vendor/thor/v1.3.2/spec/group_spec.rb:12-22` expects `MyCounter.start(%w(1 2 --third 3))` to
answer `[1, 2, 3, nil, nil, nil]`: the fixture's `options[:fourth]` etc.
(`vendor/thor/v1.3.2/spec/fixtures/group.thor:41-51`) are `Hash#[]` misses, which answer the
default, `nil` (`rb_hash_aref`, `vendor/ruby/v3.3.11/hash.c`).

In trails, the fixture reads `this.options["fourth"]`
(`packages/thor/src/test-helpers/fixtures/group.ts`), which goes through
`HashWithIndifferentAccess`'s Proxy `methodMissing` → `Hash#get`
(`packages/ruby-compat/src/hash.ts`, `get` / `default`), and a Hash with no `ifnone` answers
`undefined`, not `null`. `packages/thor/src/group.test.ts` therefore asserts `undefined` in those
three cases where Rails asserts `nil`.

A second trap in the same shape: `options["first"]` on a HWIA reads `Hash#first` (a method)
instead of the key, because the Proxy only reaches `methodMissing` for names the prototype lacks.
The BrokenCounter fixture was switched to `.get("first")` for that.

## Acceptance criteria

- [ ] A Ruby `Hash#[]` miss on a ruby-compat `Hash` with no default answers `null` (Ruby `nil`),
      or the thor fixtures read options through a form that does.
- [ ] `group_spec.rb`'s three `#start` cases assert `null` as Rails does.
- [ ] HWIA option reads whose key collides with a `Hash` method name (`first`, `keys`, …) read the
      key, as Ruby's `options[:first]` does.
