---
title: "ruby-compat-net-http-full-transport"
status: ready
updated: 2026-11-07
rfc: "0216-actionmailbox-port"
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

trails#9775 ported only the `Net::HTTP` surface `ActionMailbox::Relayer` calls (`packages/ruby-compat/src/net/`). These Ruby branches are not ported, and each carries a `CONVERGEABLE ruby-compat-net-http-full-transport` receipt at its call site:

- `Net::HTTPGenericRequest#initialize` (`vendor/ruby/v3.3.11/lib/net/http/generic_request.rb:23,36-46`): the `uri.dup`, the default `accept-encoding` header and `@decode_content`, which needs gzip/deflate decoding of the response body.
- `Net::HTTP#transport_request` (`vendor/ruby/v3.3.11/lib/net/http.rb:2329-2379`): `begin_transport` (reconnect on a closed socket, `update_uri`), the `HTTPInformation` loop, `res.uri =`, the `max_retries` / `IDEMPOTENT_METHODS_` retry, and `end_transport`.
- `Net::HTTPResponse::CODE_TO_OBJ` (`vendor/ruby/v3.3.11/lib/net/http/responses.rb:1108`): only 200 and 401 are ported. The rest of the table and its classes (`responses.rb:7-1095`) are missing.

## Acceptance criteria

- The full `CODE_TO_OBJ` table and its classes are ported in `net/http/responses.ts`.
- `generic_request.rb:15-55` and `transport_request` / `begin_transport` / `end_transport` are ported line for line, with responses decoded through ruby-compat's zlib adapter.
- Every `CONVERGEABLE ruby-compat-net-http-full-transport` receipt is removed.
