---
title: "rack-response-headers-is-a-rack-headers"
status: draft
updated: 2026-11-07
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

`Rack::Response#initialize` (`vendor/rack/v3.1.14/lib/rack/response.rb:61-75`) builds
`@headers = Headers.new` and copies each passed header into it; `finish` returns that
`Rack::Headers`. trails' `Response` (`packages/rack/src/response.ts`, constructor and
`hasHeader` / `getHeader` / `setHeader` / `deleteHeader`) holds a plain
`Record<string, any>` lowercased by a module-local `downcaseKey`, and `finish` writes
`this.headers[CONTENT_LENGTH]`. `packages/rack/src/headers.ts` already ports
`Rack::Headers`. About 100 `.headers[...]` index reads across rack's sources and tests
(`mock-response.ts`, `lint.ts`, `response.test.ts`, `static.test.ts`, …) read the plain
object and must move to `Headers#get` / `#set`.

The ArgumentError guards (`response.rb:160-175`) are already ported.

## Acceptance criteria

- `Rack::Response#headers` is a `Headers`, filled as `initialize` fills it.
- `hasHeader` / `getHeader` / `setHeader` / `deleteHeader` are the one `Headers` call
  Rack makes (`hasKey` / `get` / `set` / `delete`); `downcaseKey` is deleted.
- `finish` and every consumer read the `Headers` through its methods.
