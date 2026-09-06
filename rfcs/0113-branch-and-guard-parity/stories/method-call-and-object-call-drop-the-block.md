---
title: "MethodCall/ObjectCall drop the block Ruby's send forwards, so a Symbol-named around callback loses its continuation"
status: ready
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 11
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `validate-set-callback-narrows-options-and-wraps-filters` (PR #7514),
which rewrote `MethodCall`'s three invocation sites to send the method and raise
`NoMethodError` — but left this pre-existing gap untouched.

Rails forwards the block to the method on every one of them:

```ruby
def make_lambda
  lambda do |target, value, &block|
    target.send(@method_name, &block)
  end
end

def inverted_lambda
  lambda do |target, value, &block|
    !target.send(@method_name, &block)
  end
end
```

`vendor/rails/activesupport/lib/active_support/callbacks.rb:359-368`, and
`expand` (`:355-357`) returns `[target, block, @method_name]` precisely so the
caller can do `target.send(method, &block)`.

trails' `MethodCall#send` (`packages/activesupport/src/callbacks.ts:96-104`)
takes only the target and invokes `method.call(target)` — the block is dropped
at all three sites (`makeLambda`, `invertedLambda`, `make`). An `around`
callback named by a Symbol therefore cannot reach its `yield`: Rails'
`around :wrap_it` receives the continuation as the method's block, and in
trails that argument never arrives.

`ObjectCall` (`callbacks.ts:112-144`) has the same shape and the same gap; it
passes `target` but no block where Rails' `send(@method_name, target, &block)`
(`callbacks.rb:376-385`) passes both. Converge both together — they are two
readings of the same Ruby line.

The trails block analogue is the `next`/proceed function that
`AroundCallback` already receives (`callbacks.ts:37-40`), so the converged
shape threads that argument through `send` rather than inventing a new one.

## Acceptance criteria

- [ ] `MethodCall#send` accepts the block and forwards it, so `makeLambda`,
      `invertedLambda` and `make` all mirror `target.send(@method_name, &block)`
      (callbacks.rb:359-368).
- [ ] `ObjectCall#send` likewise mirrors `send(@method_name, target, &block)`
      (callbacks.rb:376-385).
- [ ] A Symbol-named `around` callback receives its continuation and can call
      it, covered by a test in `callbacks.trails.test.ts` that fails on the
      current baseline.
- [ ] parity:api / parity:test delta non-negative; no new call-argument
      baseline row.
