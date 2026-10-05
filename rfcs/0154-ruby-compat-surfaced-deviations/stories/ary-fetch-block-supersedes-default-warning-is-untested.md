---
title: "aryFetch's block-supersedes-default warning arm has no test"
status: draft
updated: 2026-10-05
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

`aryFetch` (`packages/ruby-compat/src/array.ts`, added in trails#8558) ports `rb_ary_fetch`
(`vendor/ruby/v3.3.11/array.c:1962-1985`). Its "block supersedes default value argument" arm
(`array.c:1969-1972`) has no test: `packages/ruby-compat/src/array.trails.test.ts` covers the index,
negative-index, default, block, `IndexError` and arity arms only.

The arm writes through ruby-compat's `warn` with a hand-written `warning:` prefix. MRI's `rb_warn`
also prefixes the caller's `file:line`, and ruby-compat has no `rb_warn` port, so the same hand-written
prefix appears in `dir.ts` too.

## Acceptance criteria

- [ ] A test in `array.trails.test.ts` passes both a default and a block to `aryFetch`, and asserts the
      warning text and that the block's value wins.
- [ ] The same test asserts nothing is written while `$VERBOSE` is `nil`.
