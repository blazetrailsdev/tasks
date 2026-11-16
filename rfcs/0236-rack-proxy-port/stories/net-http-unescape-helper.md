---
title: "Net::HTTP#unescape restored as the private helper proxy_user/pass call"
status: done
updated: 2026-11-16
rfc: "0236-rack-proxy-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: trails#10185
claim: "2026-11-16T15:36:32Z"
assignee: "net-http-unescape-helper"
blocked-by: null
closed-reason: null
---

## Context

`Net::HTTP#proxy_user` / `#proxy_pass` call the private `unescape` (`vendor/ruby/v3.3.11/lib/net/http.rb:1827-1855`). trails#10161 wrote `CGI.unescape` inline in `packages/ruby-compat/lib/net/http.ts` because a private method pushed ruby-compat's `extra-surface-internal-mark.json` count from 827 to 828.

## Acceptance criteria

- Restore `unescape` as its own method, with Rails' name, and have `proxyUser` / `proxyPass` call it.
- Offset the internal mark by converging another ruby-compat internal name, so the mark does not grow.
