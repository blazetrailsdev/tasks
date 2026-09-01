---
title: 'Drop the invented "/" default from Rack::Request::Helpers#path_info'
status: ready
updated: 2026-09-01
rfc: "0133-rack-session-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 9
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rack::Request::Helpers#path_info` (`vendor/rack/lib/rack/request.rb:190`) is
`get_header(PATH_INFO).to_s` — the header, or `""` when absent. trails
(`packages/rack/src/request.ts`, `get pathInfo()`) is
`this.getHeader(PATH_INFO) || "/"`, which invents a `"/"` default Rack does not
have and also rewrites a legitimately-empty `PATH_INFO` (which Rack treats as
meaningful: `""` with a non-empty `SCRIPT_NAME` is how a mapped app addresses
its own root) into `"/"`.

Found while converging `path`/`fullpath`/`url` in #7342, which now read
`path` = `script_name + path_info` (`:591-593`) and therefore route this
default into every URL trails builds.

`query_string` (`:189`) is the neighbouring `get_header(QUERY_STRING).to_s` and
should be checked in the same pass — trails has `|| ""`, which coincides for
`nil` but not for a stored `false`.

## Acceptance criteria

- `path_info` answers `get_header(PATH_INFO).to_s`, with no invented `"/"`.
- `query_string` is checked against `:189` in the same pass.
- Callers that relied on the `"/"` default are found and fixed rather than
  worked around; `pnpm vitest run packages/rack packages/actionpack` is green.
- Rack's `spec_request.rb` cases covering an empty `PATH_INFO` are ported by
  name.
- `parity:api` rack non-negative; `parity:api:calls` / `:args` gain no rows.
