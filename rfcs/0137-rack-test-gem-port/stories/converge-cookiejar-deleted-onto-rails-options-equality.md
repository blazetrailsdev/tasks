---
title: "CookieJar#deleted? partial-matches options where Rails compares the whole hash"
status: in-progress
updated: 2026-09-06
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 35
pr: 7581
claim: "2026-09-06T23:10:57Z"
assignee: "move-multipart-boundary-constant-to-multipart-module"
blocked-by: null
closed-reason: null
---

## Context

`CookieJar#deleted?` (`vendor/rails/actionpack/lib/action_dispatch/middleware/cookies.rb:397-401`)
is an equality test against the whole stored options hash:

```ruby
def deleted?(name, options = {})
  options.symbolize_keys!
  handle_options(options)
  @delete_cookies[name.to_s] == options
end
```

trails' `isDeleted`
(`packages/actionpack/src/action-dispatch/middleware/cookies.ts:206-214`)
instead does a partial match: it returns `true` for a bare call, and otherwise
compares only `path` and `domain`, and only when the caller supplied them. So
`deleted?("x", { domain: "example.com" })` is true in trails for a cookie
deleted with no domain, where Rails returns false.

PR #7568 added the `handle_options` call Rails makes (so the `path` default is
applied to both sides before comparing), but left the partial comparison in
place — it predates that PR and converging it is a behavior change with its
own test surface.

## Converged shape

Compare the stored delete options to the passed options for equality, as Rails
does, after `handleOptions` has normalized both.

## Acceptance criteria

- [ ] `isDeleted` compares `_deletedCookies.get(name)` to the handled options
      by value, mirroring `cookies.rb:397-401`; the `path`/`domain`-only
      partial match is gone.
- [ ] Rails' `deleted?` tests in `dispatch/cookies.test.ts` still pass; no test
      renamed or reworded.
- [ ] `pnpm parity:api` / `parity:test` deltas non-negative; both call gates
      green with no new baseline rows.
