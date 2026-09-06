---
title: "MockResponse#body returns the body list where Rails returns a buffered String"
status: done
updated: 2026-09-06
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 26
pr: 7553
claim: "2026-09-06T13:05:18Z"
assignee: "converge-rack-conditional-get-to-rfc2822-guard"
blocked-by: null
closed-reason: null
---

## Context

`Rack::MockResponse#body` (`vendor/rack/lib/rack/mock_response.rb:47-66`)
returns a **String**, not the body list:

```ruby
def body
  return @buffered_body if defined?(@buffered_body)
  # ...
  # NOTE: We can't use `@body.to_ary` because MockResponse#body is expected to
  # be a string.  However, the real response object returns the body as a list.
  buffer = @buffered_body = String.new
  @body.each do |chunk|
    buffer << chunk
  end
  # ...
end
```

The comment is explicit that this override exists _because_ the caller expects
a String where `Rack::Response#body` gives a list, and Rack's own specs read it
that way (`res.body.must_equal "foo!"`).

`packages/rack/src/mock-response.ts` does not override `body`: it inherits the
array from `Response` and adds a `bodyString` getter (`mock-response.ts:51-58`)
holding the buffered value, with `=~` / `match` routed through it
(`:62,:70`). Every trails caller therefore reads `.bodyString` where Rails reads
`.body` — `packages/rack-test/src/test.test.ts` does so 6 times, and
`spec/rack/test/cookie_spec.rb`'s `request('...').body.must_equal '1'` had to be
ported as `.bodyString` in #7541. `bodyString` has no Ruby counterpart.

## Converged shape

`MockResponse#body` overrides the inherited reader and returns the buffered
String, memoized in `_bufferedBody` the way `@buffered_body` is; `bodyString`
is deleted and its call sites move to `body`. The base `Response#body` list
stays reachable wherever Rails reaches it (`@body`).

Note the JS-side constraint to check first: `Response#body` is a property in
trails, so the override has to be a property too, and any writer on the base
class has to keep working — see the reader/writer split ratified in
CLAUDE.md's "Generated attribute readers are properties" if a `set` half is
needed.

## Acceptance criteria

- [ ] `MockResponse#body` returns the buffered String, mirroring
      `mock_response.rb:47-66`, memoized once.
- [ ] `bodyString` is gone from `packages/rack/src/mock-response.ts` and from
      every call site (`packages/rack/**`, `packages/rack-test/**`).
- [ ] `=~` / `match` read `body` directly, as `mock_response.rb:39-45` does.
- [ ] `pnpm parity:api:extra --package rack` novel/moved non-increasing;
      `parity:api:calls` / `:calls:args` non-negative.
