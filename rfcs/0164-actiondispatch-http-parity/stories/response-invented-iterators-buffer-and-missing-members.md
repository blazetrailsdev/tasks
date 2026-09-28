---
title: "Converge Response's invented iterators and buffer, and port its missing members"
status: draft
updated: 2026-09-27
rfc: "0164-actiondispatch-http-parity"
cluster: null
packages: ["actionpack"]
deps: ["http-config-seats-onto-mattr-accessor", "response-location-returns-empty-string-not-nil"]
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

`packages/actionpack/src/action-dispatch/http/response.ts` carries four novel
names (`pnpm parity:api:extra`): `[Symbol.iterator]`, `[Symbol.asyncIterator]`,
`ResponseBuffer` and `toRack`, and three moved: `inspect`, `isClosed`,
`statusCode`.

Rails' `ActionDispatch::Response`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/response.rb`):

- the Rack body is `RackBody` (`:497`), which responds to `each`, `close`,
  `to_path` and `call` (`:530`); `Response#to_a` (`:410`) returns
  `rack_response(@status, @headers.to_hash)` (`:546`), and `alias prepare! to_a`
  (`:414`)
- the stream buffer is `Response::Buffer` (`:100`), with `write` (`:122`)
- `ContentTypeHeader = Struct.new :mime_type, :charset` (`:434`)

`pnpm parity:api` reports `prepare!`, `ContentTypeHeader#mime_type` /
`mime_type=` and `RackBody#call` missing. An iterator protocol is JS's
equivalent of `each` (CLAUDE.md § "Ruby protocol methods with a different JS
mechanism" covers the pattern), but it belongs on `RackBody` / `Buffer`, not on
`Response`.

One call baseline row sits in `actiondispatch/http/response.json`.

## Acceptance criteria

- `ResponseBuffer` becomes `Response::Buffer`, `toRack` becomes `toA` /
  `prepareBang`, and the iterators move onto `RackBody` / `Buffer` with a
  receipt pointing at the CLAUDE.md section.
- `ContentTypeHeader` exposes `mimeType` / `charset` as a Struct does, and
  `RackBody#call` exists.
- The moved names are gone or relocated; `response.json` is empty.
- `pnpm parity:api` reports `http/response.rb` 94/94.
