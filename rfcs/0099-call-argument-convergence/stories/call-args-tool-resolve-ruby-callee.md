---
title: "Comparator: resolve Ruby __callee__ to the enclosing method name (32 rows)"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6349
claim: "2026-08-11T01:54:24Z"
assignee: "call-args-tool-resolve-ruby-callee"
blocked-by: null
closed-reason: null
---

## Context

Filed by the RFC 0099 classification pass (PR #6348). 32 `activerecord` rows —
the single largest same-shape block in the package — exist only because Ruby's
`__callee__` has no TS spelling.

`relation/query_methods.rb:2213`
`check_if_method_has_arguments!(method_name, args, message = nil)` is called
throughout `query_methods.rb` as
`check_if_method_has_arguments!(__callee__, args)`. The port passes the same
value as a literal: `checkIfMethodHasArguments("includes", associations)`. The
comparator sees `ref:__callee__` vs `str:includes` and flags a shape
divergence at every one of the 32 call sites, all of which are correct.

`__callee__` is statically knowable: it is the name of the enclosing Ruby
method, which the extractor already has (it keys every row by `rubyName`).

## Acceptance criteria

1. The extractor normalizes a `__callee__` argument to the enclosing method's
   name, compared against the TS argument through the existing Ruby→TS name
   conventions (`scripts/parity/conventions.ts`), so `__callee__` inside
   `eager_load` matches `"eagerLoad"`.
2. `__method__` is handled the same way if it appears.
3. The 32 bucket-(b) rows go stale and are deleted from the baseline.
4. `pnpm parity:api:calls:args` is green and the total row count strictly
   decreases.
