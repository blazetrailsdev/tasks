---
title: "Rack::BodyProxy respond_to_missing?/method_missing diverge from body_proxy.rb (invented delegate, no super/include_all)"
status: draft
updated: 2026-09-28
rfc: "0141-actionpack-surfaced-deviations"
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

Surfaced in trails#8209, which renamed `BodyProxy`'s probe to
`respondToMissing` (`packages/rack/src/body-proxy.ts`). There is no rack
surfaced-deviations bucket, and Rack sits beneath actionpack, so this story
is filed here.

Rack's `respond_to_missing?`
(`vendor/rack/v3.1.14/lib/rack/body_proxy.rb:17-24`):

```ruby
def respond_to_missing?(method_name, include_all = false)
  case method_name
  when :to_str
    false
  else
    super or @body.respond_to?(method_name, include_all)
  end
end
```

Rack's `method_missing` (`body_proxy.rb:45-58`) sends every name except
`:to_str` to `@body`. `:to_ary` sends it and then calls `close` in an
`ensure`.

trails' port differs in several ways:

- `respondToMissing(methodName)` drops `include_all` and never calls `super`.
- It answers both the camel and the snake spelling (`toArray` / `to_ary`,
  `toPath` / `to_path`, `toStr` / `to_str`) with hand-written arms.
- For any other name it probes `typeof this.body?.[methodName] === "function"`
  instead of `rbObjRespondTo(this.body, methodName, includeAll)`.
- The forwarding half is an invented `delegate(method, ...args)` method.
  Rack's is `method_missing`, which CLAUDE.md's protocol table decides per
  class. A `Proxy` trap already exists in the `BodyProxy` constructor.
- `delegate`'s `to_str` arm throws a plain `Error("NoMethodError: ...")`
  where Rack raises `NoMethodError` through `super`.

## Acceptance criteria

- `respondToMissing(methodName, includeAll = false)` mirrors
  `body_proxy.rb:17-24`: `false` for `to_str`, otherwise `super` or
  `rbObjRespondTo(this.body, methodName, includeAll)`.
- The forwarding half is ported as `methodMissing` (`body_proxy.rb:45-58`),
  reached from the existing Proxy trap, with `to_ary` closing in a `finally`
  and `to_str` raising ruby-compat's `NoMethodError`. The invented `delegate`
  is removed.
- `body-proxy.test.ts` probes through `rbObjRespondTo(proxy, ...)`, the port
  of Rack's `respond_to?`, not through `respondToMissing` directly.
