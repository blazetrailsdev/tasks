---
title: "Net::HTTP#write_timeout= reaches the open socket"
status: draft
updated: 2026-11-14
rfc: "0236-rack-proxy-port"
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

`Net::HTTP#write_timeout=` (`vendor/ruby/v3.3.11/lib/net/http.rb:1367-1370`) runs `@socket.write_timeout = sec if @socket`, and `connect` passes `write_timeout` to `BufferedIO`. The ruby-compat port (`packages/ruby-compat/lib/net/http.ts` `set writeTimeout`) stores only `@write_timeout`, and the HTTP adapter connection (`packages/ruby-compat/lib/http-adapter.ts`) has no write timeout to set.

## Acceptance criteria

- The adapter connection accepts a write timeout and raises `Net::WriteTimeout` when it expires.
- `writeTimeout=` forwards to an open socket, as in `http.rb:1368`, and `connect` passes it on.
- A test citing `http.rb:1367-1370`.
