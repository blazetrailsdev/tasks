---
title: "net-http-debug-output-writes"
status: draft
updated: 2026-11-14
rfc: "0236-rack-proxy-port"
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

`Net::HTTP#set_debug_output` (`vendor/ruby/v3.3.11/lib/net/http.rb:1188-1191`) stores `@debug_output`.
Ruby's `connect` and `Net::BufferedIO` (`vendor/ruby/v3.3.11/lib/net/protocol.rb`, `debug_output`) write the wire
traffic to that output. The ruby-compat port (`packages/ruby-compat/lib/net/http.ts`, `setDebugOutput`) stores the output, but
nothing writes to it.

## Acceptance criteria

- `connect` and request/response transport write to `@debug_output` (`opening connection to ...`, `<-`/`->` lines),
  the same writes Ruby's `D` and `BufferedIO` make.
- A ruby-compat test that cites the MRI lines.
- The `CONVERGEABLE` receipt on `setDebugOutput` becomes `PERMANENT` or is removed.
