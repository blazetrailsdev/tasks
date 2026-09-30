---
title: "rack-set-cookie-header-same-site-rejects-symbol-spelling"
status: draft
updated: 2026-09-30
rfc: "0141-actionpack-surfaced-deviations"
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

Ruby Rack's `set_cookie_header`
(`vendor/rack/v3.1.14/lib/rack/utils.rb:305-316`) matches:

```ruby
case value[:same_site]
when false, nil
when :none, 'None', :None      then '; samesite=none'
when :lax, 'Lax', :Lax         then '; samesite=lax'
when true, :strict, 'Strict', :Strict then '; samesite=strict'
else raise ArgumentError, "Invalid :same_site value: ..."
```

It accepts the Symbols `:lax` / `:Lax` and the capitalised String `'Lax'`,
but **not** the lowercase String `'lax'`. So control flow turns on Symbol vs
String. CLAUDE.md ("A Ruby Symbol is a JS string") says that case keeps the
colon: `:lax` is `":lax"`.

trails' port (`packages/rack/src/utils.ts:311-316`) does the reverse. It
accepts `"lax"` / `"none"` / `"strict"`, which Ruby rejects, and raises on
`":lax"`. trailties seeds the Rails default correctly as a Symbol:
`actionDispatch.cookiesSameSiteProtection = ":lax"`
(`packages/trailties/src/application/configuration.ts:222`, Rails'
`load_defaults "6.1"`). So once `env_config` reaches requests, every cookie
write raises `ArgumentError: Invalid :same_site value: :lax`.

Found re-running the root README quickstart (PR #8195) on `main` at `329f709afd`,
right behind `trails-server-serves-the-middleware-stack-not-the-application`.

## Converged shape

The three arms match `":none" | "None" | ":None"`, `":lax" | "Lax" | ":Lax"`
and `true | ":strict" | "Strict" | ":Strict"`, exactly Ruby's `when` lists. The
lowercase bare strings are dropped. Audit the other `packages/rack` callers that
pass `sameSite` for the bare spelling.

## Acceptance criteria

- [ ] `setCookieHeader` accepts exactly Ruby's values, and raises on `"lax"` as Ruby does.
- [ ] Rack's `utils_test.rb` same_site cases are ported (or already present and updated).
