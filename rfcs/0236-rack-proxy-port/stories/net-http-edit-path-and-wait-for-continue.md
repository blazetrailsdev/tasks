---
title: "net-http-edit-path-and-wait-for-continue"
status: done
updated: 2026-11-15
rfc: "0236-rack-proxy-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10149
claim: "2026-11-15T20:21:08Z"
assignee: "net-http-edit-path-and-wait-for-continue"
blocked-by: null
closed-reason: null
---

## Context

`Net::HTTP#transport_request` (`vendor/ruby/v3.3.11/lib/net/http.rb:2329-2338`) writes
`req.exec @socket, @curr_http_version, edit_path(req.path)` inside `catch(:response)`.
trails' `transportRequest` (`packages/ruby-compat/lib/net/http.ts`) passes `req.path`
because Net::HTTP's proxy surface (`proxy?`, `edit_path`, `http.rb:1867-1879`) is not
ported, and drops `catch(:response)`, which only `HTTPGenericRequest#wait_for_continue`
(`generic_request.rb:364-383`) throws.

## Acceptance criteria

- Port `proxy?` / `proxy_address` etc. and `edit_path` (`http.rb:1867-1879`); `transportRequest` calls `editPath(req.path)`.
- Port `wait_for_continue` and the `catch(:response)` it throws to, in `send_request_with_body` order.
- Remove the `@missingRailsCall edit_path` / `catch` receipts in `transportRequest`.
