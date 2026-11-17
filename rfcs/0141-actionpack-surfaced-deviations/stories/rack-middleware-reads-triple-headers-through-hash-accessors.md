---
title: "rack-middleware-reads-triple-headers-through-hash-accessors"
status: draft
updated: 2026-11-17
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

`rack-response-headers-is-a-rack-headers` / `rack-response-initialize-copies-headers-into-rack-headers` want `Rack::Response#headers` to be a `Rack::Headers` (`vendor/rack/v3.2.8/lib/rack/response.rb:57-65`). Tried in the html5-document bundle: the Response change itself is ~20 LOC, but `finish` then hands a Map-backed `Headers` into every middleware, and those index the triple's headers as a plain object (`headers[X]`, `delete headers[X]`, `Object.entries(headers)`):
`packages/rack/lib/etag.ts:33-42`, `conditional-get.ts:26-51`, `common-logger.ts:76`, `static.ts:116`, `deflater.ts:61-117`, `runtime.ts:24`, `lint.ts:219,512,594-630`, `content-type.ts:20-21`, `content-length.ts:21-30`, `sendfile.ts:37-49`, `files.ts:152-207`, and `utils.ts` `set_cookie_header!` / `delete_cookie_header!` (`:360-402`). Rack reads them all with `Hash#[]` / `[]=` / `delete`, which `Rack::Headers` answers. The result was ~50 red tests (rack-session cookie/pool, mock-response, auth-basic, response) and ~160 typecheck sites in tests.

## Acceptance criteria

- Every rack middleware listed reads/writes a response triple's headers through a dispatching accessor (`hashAref` / `hashAset` / `hashDelete`, ruby-compat) so a `Rack::Headers` or plain object both work.
- `Lint#check_headers` iterates with ruby-compat `each`.
- This unblocks `rack-response-headers-is-a-rack-headers` and `rack-response-initialize-copies-headers-into-rack-headers`.
