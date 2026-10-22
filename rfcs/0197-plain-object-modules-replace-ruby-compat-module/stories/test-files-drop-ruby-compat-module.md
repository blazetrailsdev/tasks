---
title: "Tests outside ruby-compat build plain/class modules, not new Module()"
status: done
updated: 2026-10-22
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: retire
packages: ["actionpack", "actionview", "activemodel", "activerecord", "activesupport", "trailties"]
deps: []
deps-rfc: []
est-loc: 400
priority: 11
pr: trails#9208
claim: "2026-10-22T11:43:28Z"
assignee: "test-files-drop-ruby-compat-module"
blocked-by: null
closed-reason: null
---

## Context

The per-package stories target non-test source. Test files outside ruby-compat still build ruby-compat `Module`s, which block deleting the class. On origin/main (2026-10-21), there are 81 `new Module(` lines across `*.test.ts` files: actionpack 14 files, activesupport 13, activerecord 8, activemodel 5, actionview 3, trailties 1.

Many port Ruby test bodies that do `Module.new do ... end` or `Module.new { def foo; super; end }`.

## Acceptance criteria

- Each test builds its module the way RFC 0197 prescribes: a plain object, a class module, or `defineModule`, with `super` via `rbCallSuper` where the test's Ruby body calls `super`.
- A test that exercises carrier-only behaviour (`superMethod`, live include) is rewritten against the plain-module semantics or removed, and the PR lists each one.
- `git grep -n 'new Module(' -- 'packages/*.test.ts' ':!packages/ruby-compat'` is empty.
