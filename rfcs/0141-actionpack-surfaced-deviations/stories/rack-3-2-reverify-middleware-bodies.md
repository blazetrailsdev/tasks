---
title: "rack-3-2-reverify-middleware-bodies"
status: in-progress
updated: 2026-11-07
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9831
claim: "2026-11-07T14:01:56Z"
assignee: "rack-3-2-reverify-middleware-bodies"
blocked-by: null
closed-reason: null
---

## Context

`bump-vendored-rack-anchor-to-3-2` moved the rack anchor to `v3.2.8` and re-pinned these middleware bodies without re-verifying the TS ports. Ruby under `vendor/rack/v3.2.8/lib/rack/`; TS under `packages/rack/src/`.

Drifted: `auth/abstract/request.rb#request`, `builder.rb#map/#run/#use`, `conditional_get.rb#call`, `directory.rb#initialize/#each/#check_forbidden`, `files.rb#fail`, `head.rb#call`, `media_type.rb.type/.params`, `mock_response.rb#body/#parse_cookies_from_header/#identify_cookie_attributes`, `rewindable_input.rb#call`, `sendfile.rb#initialize/#variation/#map_accel_path`, `static.rb#initialize/#applicable_rules/#route_file`, `version.rb.release`. Removed upstream: `logger.rb` (`Rack::Logger`; pins pruned).

## Acceptance criteria

- Each listed method mirrors its v3.2.8 body.
- `Rack::Logger` is removed from trails if nothing in Rails v8.0.2 still requires it, or kept with a receipt naming the Rails caller.
