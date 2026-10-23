---
title: "Rack::Request::Env: getHeader reads null on a miss; eachHeader returns env / an enumerator"
status: ready
updated: 2026-10-22
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rack::Request::Env` (`vendor/rack/v3.1.14/lib/rack/request.rb:82-146`) is now its own module in `packages/rack/src/request.ts` (trails#9146). Two of its readers still return something different from what Rack returns:

- `get_header(name)` is `@env[name]` (`request.rb:99-102`), which is nil for an absent key. `Env.getHeader` returns `undefined`.
- `each_header(&block)` is `@env.each(&block)` (`request.rb:110-112`). It returns the env hash when given a block, and an enumerator when not. `Env.eachHeader` requires a callback and returns `void`. `TestProxyRequest`'s `DelegateRequest` forwards it (`vendor/rack/v3.1.14/test/spec_request.rb:1927-1928`).

Raised in review on trails#9146.

## Acceptance criteria

- [ ] `Env.getHeader` returns `null` for an absent key. Readers in `Helpers` that currently add `?? null` (`body`, `contentLength`, `referer`, ...) drop the extra guard where Rack has none.
- [ ] `Env.eachHeader` returns the env when given a block, and `toEnum("eachHeader")` without one, the way `enum_for` works.
