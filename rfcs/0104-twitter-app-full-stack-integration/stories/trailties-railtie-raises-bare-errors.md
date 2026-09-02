---
title: "trailties-railtie-raises-bare-errors"
status: draft
updated: 2026-09-02
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Three raise sites in the railties port throw bare JS errors where Rails raises a
named Ruby class, so a caller cannot rescue them the way Rails code does:

- `packages/trailties/src/trailtie.ts` — `new Error("<X> is abstract, you cannot
instantiate it directly.")`. Ruby is a bare `raise "..."`
  (`railties/lib/rails/railtie.rb:247`), i.e. `RuntimeError`.
- `packages/trailties/src/trailtie/configurable.ts` — `new Error("You cannot
inherit from a <X> child")`. Ruby is a bare `raise`
  (`railties/lib/rails/railtie/configurable.rb:14`), i.e. `RuntimeError`.
- `packages/trailties/src/initializable.ts` — `new TypeError("A block must be
passed when defining an initializer")`. Ruby raises **ArgumentError**
  (`railties/lib/rails/initializable.rb:89`), and
  `railties/test/initializable_test.rb:170` asserts `assert_raise(ArgumentError)`.
  trails' `initializable.test.ts` currently asserts `TypeError`, so the test
  encodes the deviation.

`initializable.ts` also throws bare `Error` for an unbound initializer and for a
cyclic dependency; the latter mirrors Ruby's `TSort::Cyclic`.

## Converged shape

`RuntimeError` and `ArgumentError` from `@blazetrails/ruby-compat` at the three
sites above, keeping the message strings byte-identical. The
`initializable.test.ts` assertion changes to `ArgumentError` — that is fixing
the port to match `initializable_test.rb:170`, not renaming a test.

Built and verified once in PR #7386, closed unmerged for an unrelated reason;
that diff is a working reference.

## Acceptance criteria

- [ ] `railtie.rb:247` and `railtie/configurable.rb:14` raise `RuntimeError`.
- [ ] `initializable.rb:89` raises `ArgumentError`, and the ported test asserts
      it.
- [ ] Message strings unchanged.
- [ ] Test case names unchanged.
