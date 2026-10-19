---
title: "Http::URL raises ArgumentError for a missing host and an invalid protocol"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Http::URL` raises `ArgumentError` at two sites:

- `full_url_for`, when `:host` is missing
  (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/url.rb:66`)
- `normalize_protocol`, for an unrecognised `:protocol` (`url.rb:144`)

trails throws a bare `Error` at both
(`packages/actionpack/src/action-dispatch/http/url.ts:78` and `:180`). The
message strings already match.

`path_for` also guards `options.key?(:path)` (`url.rb:73`) where trails writes
`"path" in options && options.path !== undefined`.

## Acceptance criteria

- Both sites throw `ArgumentError` with Rails' message.
- `pathFor`'s `:path` guard is the key test Rails makes.
- A Rails test that asserts `ArgumentError` on a missing host passes with the
  error class asserted.
