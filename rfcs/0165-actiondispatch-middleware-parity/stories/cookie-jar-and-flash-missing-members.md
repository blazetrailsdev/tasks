---
title: "Port CookieJar's and Flash's missing members and seat the Flash class"
status: draft
updated: 2026-09-27
rfc: "0165-actiondispatch-middleware-parity"
cluster: null
packages: ["actionpack"]
deps: ["cookiejar-parse-shadows-rails-parse-methods"]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api --package actiondispatch`, under
`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/`:

- `cookies.rb` 46/55 — `CookieJar#key?` / `has_key?`, `update(other_hash)`
  (`:361`), `update_cookies_from_jar` (`:366`), `to_header` (`:373`),
  `clear(options = {})` (`:425`), `mattr_accessor :always_write_cookie`
  (`:441`, reader and writer), and `escape` (`:444`)
- `flash.rb` 23/27 — `FlashHash#key?`, `merge!`, `now_is_loaded?`, and
  `stringify_array` (`:305`). `pnpm parity:api --inheritance` reports `Flash`
  (`flash.rb:50`, the middleware class that holds `KEY`, `RequestMethods`,
  `FlashNow` and `FlashHash`) as missing in trails.

`pnpm parity:api:extra` lists a novel `has` on both `middleware/cookies.ts` and
`middleware/flash.ts` (Rails spells it `key?` / `has_key?`) and moved names on
`cookies.ts` (`empty`, `get`, `keys`, `request`, `set`, `size`, `values`) and
`flash.ts` (`get`, `set`).

Call baseline rows: `middleware/cookies.json` 1, `middleware/flash.json` 4.

## Acceptance criteria

- The missing members exist at their Rails names and hosts with Rails' bodies;
  `alwaysWriteCookie` is a `mattrAccessor`.
- `Flash` exists as the Rails class with its nested constants, and
  `FlashHash` / `FlashNow` / `RequestMethods` hang off it.
- `has` is gone from both files; each moved name is removed or relocated.
- `cookies.json` and `flash.json` are empty.
- `pnpm parity:api` reports `cookies.rb` and `flash.rb` at 100% with no
  inheritance row.
