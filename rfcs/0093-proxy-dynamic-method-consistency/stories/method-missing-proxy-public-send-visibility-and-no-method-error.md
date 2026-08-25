---
title: "methodMissingProxy matches respond_to?/public_send visibility and the else-super NoMethodError arm"
status: done
updated: 2026-08-08
rfc: "0093-proxy-dynamic-method-consistency"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6252
claim: "2026-08-08T17:55:11Z"
assignee: "method-missing-proxy-public-send-visibility-and-no-method-error"
blocked-by: null
closed-reason: null
---

## Context

`methodMissingProxy` (`packages/activesupport/src/method-missing-proxy.ts`, added
by PR #6202, adopted by `command-recorder.ts`, `connection-management.ts`
(`BodyProxy`) and `activemodel/type/normalized-value.ts`) forwards with a plain
property read. Rails' `method_missing` is narrower on both ends:

```ruby
# activerecord/lib/active_record/migration/command_recorder.rb:395-405
def respond_to_missing?(method, _)
  super || delegate.respond_to?(method)
end

# Forwards any missing method call to the \target.
def method_missing(method, ...)
  if delegate.respond_to?(method)
    delegate.public_send(method, ...)
  else
    super
  end
end
```

Two gaps against that body:

1. **Visibility.** `respond_to?` and `public_send` are _public_-only. The TS
   proxy reads any property, so a member Ruby treats as private or protected on
   the delegate is reachable through the wrapper, and the `has` trap
   (`Reflect.has` + `prop in Object(delegate)`) answers `true` for it where
   `respond_to_missing?` would answer `false`.
2. **The `else super` arm.** Rails raises `NoMethodError` for a name the delegate
   does not answer; the TS proxy returns `undefined`. Rails' own
   `command_recorder_test.rb:20-24` (`test_send_calls_super`) asserts exactly
   this: `assert_raises(NoMethodError) { @recorder.send(:non_existing_method, :horses) }`.

## Converged shape

For (1): consult the delegate's _public_ surface. The nearest TS analogue is an
own/prototype descriptor walk that skips members the codebase marks private
(leading `_` is the trails convention, and `eslint/rails-private-methods.json`
already carries the Ruby-side private set per file, so the manifest can drive it
rather than a heuristic).

For (2): a JS `get` trap cannot raise without breaking feature detection —
`typeof x.foo === "function"` and `"foo" in x` both route through the proxy, and
throwing there would make every probe explode. Converge as far as the language
allows: return a function that raises `NoMethodError` when _called_, so the
send-path matches `test_send_calls_super` while a bare property read stays total.
If that turns out to break a real caller, `pnpm tasks block` with the specific
one rather than widening the deviation.

`command-recorder.trails.test.ts` already covers the value-forwarding half
("forwards a non-function delegate member the way public_send does"); this story
adds the visibility and NoMethodError halves.

## Acceptance criteria

- [ ] A private/protected delegate member is not forwarded and `has` answers
      `false` for it, matching `respond_to?`/`public_send`
      (`command_recorder.rb:396,401`).
- [ ] Calling a name no delegate answers raises `NoMethodError`, matching the
      `else super` arm; `test_send_calls_super`
      (`command_recorder_test.rb:20-24`) is ported and green.
- [ ] All three adopters keep their current behavior for public members;
      `normalized-value.ts` keeps binding delegated methods to the underlying
      type (its un-normalized `cast` dispatch).
- [ ] `pnpm parity:api:extra` shows no new surface; `pnpm parity:api:calls` non-negative.
