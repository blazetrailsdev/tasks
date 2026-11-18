---
title: "net-http-ssl-session-and-post-connection-check"
status: done
updated: 2026-11-18
rfc: "0226-mail-stack-to-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10231
claim: "2026-11-17T11:21:48Z"
assignee: "net-http-ssl-session-and-post-connection-check"
blocked-by: null
closed-reason: null
---

## Context

`Net::HTTP#connect` (`vendor/ruby/v3.3.11/lib/net/http.rb:1670-1677`) sets `s.session = @ssl_session` when the cached session is still fresh. After `ssl_socket_connect` it runs `s.post_connection_check(@address)` when the context verifies peers and `verify_hostname` is on. trails#10190 moved `packages/ruby-compat/lib/net/http.ts` `connect` onto a real `OpenSSL::SSL::SSLSocket`, but `SSLSocket` (`packages/ruby-compat/lib/openssl.ts`) has neither `session=` nor `post_connection_check` (`ext/openssl/lib/openssl/ssl.rb`).

## Acceptance criteria

- [ ] `SSLSocket#session=` and `#post_connection_check` are ported from `ext/openssl/lib/openssl/ssl.rb`.
- [ ] `HTTP#connect` sets the session and calls `post_connection_check` with the same guards as http.rb:1670-1677.
