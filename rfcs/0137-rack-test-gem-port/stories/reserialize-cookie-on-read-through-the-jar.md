---
title: "reserialize-cookie-on-read-through-the-jar"
status: done
updated: 2026-09-07
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7598
claim: "2026-09-07T19:26:54Z"
assignee: "port-chained-cookie-jars-module-and-memoize-the-readers"
blocked-by: null
closed-reason: null
---

## Context

`SerializedCookieJars#parse` reserializes a cookie on read:

```ruby
def parse(name, dumped, force_reserialize: false, **)
  if dumped
    begin
      value = serializer.load(dumped)
    rescue StandardError
      return
    end

    self[name] = { value: value } if force_reserialize || reserialize?(dumped)

    value
  end
end
# actionpack/lib/action_dispatch/middleware/cookies.rb:594-608
```

`reserialize?` (`cookies.rb:588-592`) is true when the configured serializer is
a `SerializerWithFallback` that did not itself produce `dumped` — i.e. the
cookie is still in the old format and reading it should migrate it. This is
what makes the `:hybrid` / `SerializerWithFallback` migrations in
`cookies_test.rb` ("can migrate marshal dumped value to json", ~`:1140-1200`)
write the new format back.

trails ported the load-and-rescue half as the free `parse` function in
`packages/actionpack/src/action-dispatch/middleware/cookies.ts` (#7595 gave it
its current shape) and ported `reserialize?` as `isReserialize` in the same
file — but nothing calls `isReserialize`, and `parse` has no
`force_reserialize` parameter, so no cookie is ever migrated on read.

The blocker is the write-back target: Ruby's `self[name] = { value: value }`
goes through the jar, and trails' `parse`/`commit`/`isReserialize` are
`this`-typed module functions whose host is `SerializedCookieJarsHost`
(`{ request }`) — it has no jar to assign into. Wiring this up means either
moving these bodies onto the jar classes or widening the host, which is why
PR #7595 left it alone rather than half-wiring it.

`force_reserialize` additionally comes from `on_rotation`
(`cookies.rb:628-632`), and trails has no cookie rotation yet, so the
`reserialize?` arm is the reachable half today.

Surfaced in review of #7595.

## Acceptance criteria

- [ ] `parse` writes `{ value }` back through the jar when `isReserialize`
      is true, per `cookies.rb:601`.
- [ ] `isReserialize` has a caller; it keeps the `SerializerWithFallback`
      guard of `cookies.rb:588-592` (or the trails equivalent) rather than
      reserializing unconditionally.
- [ ] `parse` takes `force_reserialize` per `cookies.rb:594`, even if the
      rotation caller that supplies it lands later.
- [ ] A test mirrors one of `cookies_test.rb`'s "can migrate ... dumped value
      to ..." cases, with the test name verbatim.
- [ ] Both call gates green with no new baseline rows.
