---
title: "Port Net::HTTP's remaining request classes so the idempotent retry is reachable"
status: ready
updated: 2026-11-13
rfc: "0216-actionmailbox-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9892 ported `Net::HTTP#transport_request`'s `max_retries` / `IDEMPOTENT_METHODS_` retry (`vendor/ruby/v3.3.11/lib/net/http.rb:2329-2379`), but `packages/ruby-compat/lib/net/http/requests.ts` holds only `Net::HTTP::Post`. Without an idempotent request class the retry arm cannot be reached or tested. The missing classes are in `vendor/ruby/v3.3.11/lib/net/http/requests.rb` (`Get`, `Head`, `Put`, `Delete`, `Options`, `Trace`, `Patch`, and the WebDAV verbs), along with the `Net::HTTP#get` / `#head` / `#request_get` entry points (`http.rb`).

## Acceptance criteria

- `requests.rb`'s request classes are ported in `net/http/requests.ts`, each with Ruby's `METHOD` / `REQUEST_HAS_BODY` / `RESPONSE_HAS_BODY`.
- `Net::HTTP#get` and `#head` are ported line for line.
- A test shows a GET retried once on a dropped connection and a POST not retried.
