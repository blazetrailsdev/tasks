---
title: "converge-rack-request-get-post-params-cluster"
status: done
updated: 2026-09-01
rfc: "0133-rack-session-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 11
pr: 7348
claim: "2026-09-01T17:28:51Z"
assignee: "converge-rack-request-path-info-default"
blocked-by: null
closed-reason: null
---

## Context

`converge-rack-request-helpers-divergent-bodies` listed four clusters of
`Rack::Request::Helpers` bodies that do not mirror the Ruby they are cited
against. PR for that story converged the authority/host/port cluster, the
`ip` / `trusted_proxy?` cluster, `cookies`, `fullpath`/`path`/`base_url`/`url`
and `values_at`, and left the params cluster — `GET` and `POST` — for this
story, to stay inside the LOC ceiling.

`Rack::Request::Helpers#GET` (`vendor/rack/lib/rack/request.rb:479-491`)
compares `RACK_REQUEST_QUERY_STRING` against the current `query_string` and
`warn`s when they differ before reparsing; trails
(`packages/rack/src/request.ts`, `get GET()`) has neither the `warn` nor the
`rr_query_string`-shaped comparison, and additionally requires
`RACK_REQUEST_QUERY_HASH` to be truthy.

`#POST` (`request.rb:497-539`) is further off:

- no `RACK_REQUEST_FORM_ERROR` arm (`:498-500`) and no `rescue => error` that
  seats it (`:536-539`);
- no `form_input.equal?(rack_input)` identity check against
  `RACK_REQUEST_FORM_INPUT` (`:507-513`), and no `warn` for the mismatch arm;
- multipart pairs are not routed through `expand_param_pairs`
  (`:521-523`) — trails calls `parseMultipart()` and seats the hash directly,
  so `RACK_REQUEST_FORM_PAIRS` is never seated by `POST`;
- the `\0` trim is `body === "\0"` rather than Ruby's
  `form_vars.slice!(-1) if form_vars.end_with?("\0")` (`:527`);
- the media-type branch is `mt.startsWith("multipart/")` rather than Ruby's
  `if pairs = Rack::Multipart.parse_multipart(env, ParamList)` (`:521`).

`Request#formPairs` (`packages/rack/src/request.ts`) and its private
`_parseFormPairs` helper have no Rails counterpart in this shape and should be
re-derived from `RACK_REQUEST_FORM_PAIRS` once `POST` seats it.

## Acceptance criteria

- `GET` and `POST` match `request.rb:479-491` and `:497-539` line for line,
  including the two `warn` calls, the `RACK_REQUEST_FORM_ERROR` seat/raise
  arms, the `equal?` identity check, and `expand_param_pairs` over multipart
  pairs.
- `formPairs` / `_parseFormPairs` are removed or re-derived from what `POST`
  seats; no invented public surface remains (`pnpm parity:api:extra --package rack`).
- Rack's own `spec_request.rb` cases for GET/POST are ported verbatim by name.
- `parity:api` rack non-negative on `request.rb` (98% at filing);
  `parity:api:calls` / `:args` gain no rows.
