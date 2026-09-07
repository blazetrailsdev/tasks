---
title: "converge-cookiejar-set-onto-rails-index-assign-guard"
status: in-progress
updated: 2026-09-06
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 34
pr: 7581
claim: "2026-09-06T23:10:57Z"
assignee: "move-multipart-boundary-constant-to-multipart-module"
blocked-by: null
closed-reason: null
---

## Context

`CookieJar#[]=` (`vendor/rails/actionpack/lib/action_dispatch/middleware/cookies.rb:371-390`)
only mutates its three maps when the value actually changed, or when the
caller passed `:expires`:

```ruby
handle_options(options)

if @cookies[name.to_s] != value || options[:expires]
  @cookies[name.to_s] = value
  @set_cookies[name.to_s] = options
  @delete_cookies.delete(name.to_s)
end

value
```

trails' `set` (`packages/actionpack/src/action-dispatch/middleware/cookies.ts:144-156`)
drops that guard and mutates unconditionally on every call, so re-assigning a
cookie to the value it already holds re-adds it to `_setCookies` and emits a
redundant `set-cookie` on the response. It also returns `void` where Rails
returns `value`.

Surfaced in review of #7568, which ported `handle_options` and wired it into
`set` / `delete` / `deleted?` at the Rails call positions; the change-guard
was pre-existing and out of that PR's scope.

## Acceptance criteria

- [ ] `set` mirrors `cookies.rb:371-390`: `handle_options`, then the
      `@cookies[name.to_s] != value || options[:expires]` guard around the three
      mutations.
- [ ] `set` returns the assigned value, as Ruby's `[]=` does.
- [ ] No test renamed; `pnpm parity:api` / `parity:test` deltas non-negative;
      both call gates green with no new baseline rows.
