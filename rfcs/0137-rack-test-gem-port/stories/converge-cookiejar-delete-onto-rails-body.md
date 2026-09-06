---
title: "converge-cookiejar-delete-onto-rails-body"
status: draft
updated: 2026-09-06
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`CookieJar#delete` (`vendor/rails/actionpack/lib/action_dispatch/middleware/cookies.rb:404-413`)
is:

```ruby
def delete(name, options = {})
  return unless @cookies.has_key? name.to_s

  options.symbolize_keys!
  handle_options(options)

  value = @cookies.delete(name.to_s)
  @delete_cookies[name.to_s] = options
  value
end
```

trails' `delete`
(`packages/actionpack/src/action-dispatch/middleware/cookies.ts:198-209`)
carries two deviations Rails does not have:

- an early `if (this._committed) return undefined;` guard. Rails checks
  `committed?` once, at the write site — `Cookies#call`
  (`cookies.rb:710`), whose trails port already does the same
  (`cookies.ts`'s `Cookies#call`). The per-method guard is redundant and
  makes `delete` answer `nil` where Rails answers the deleted value.
- a `this._setCookies.delete(name)` line with no counterpart in the Ruby
  body. Rails leaves `@set_cookies` alone, so a cookie that was both set
  and deleted in one request still writes its `set-cookie` from
  `@set_cookies` before the delete header — which is what `write`
  (`cookies.rb:429-439`) iterating both maps means.

Surfaced in #7581, which converged the sibling `[]=` (`cookies.rb:371-390`)
and `deleted?` (`:397-401`) onto their Ruby bodies and removed the same
`_committed` guard from `[]=`. `delete` was out of that PR's scope.

Note `dispatch/cookies.test.ts`'s "delete and set cookie" asserts one header
today, which is the `_setCookies.delete` behaviour; check Rails'
`test_delete_and_set_cookie` (`vendor/rails/actionpack/test/dispatch/cookies_test.rb`)
before changing the assertion, and mirror whatever it asserts.

## Acceptance criteria

- [ ] `delete` mirrors `cookies.rb:404-413`: the `has_key?` guard,
      `handleOptions`, the two map writes Rails makes, and the returned value.
- [ ] The `_committed` guard and the `_setCookies.delete` line are gone; the
      commitment check stays where Rails has it, in `Cookies#call`.
- [ ] Rails' `delete`-related tests in `dispatch/cookies.test.ts` still pass,
      with no test renamed or reworded.
- [ ] `pnpm parity:api` / `parity:test` deltas non-negative; both call gates
      green with no new baseline rows.
