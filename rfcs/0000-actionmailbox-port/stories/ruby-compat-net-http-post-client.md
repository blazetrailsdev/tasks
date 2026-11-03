---
title: "Port the Net::HTTP client surface ActionMailbox::Relayer calls"
status: draft
updated: 2026-11-03
rfc: "0000-actionmailbox-port"
cluster: amb-infra
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionmailbox/lib/action_mailbox/relayer.rb:54-72` builds
`Net::HTTP.new(uri.host, uri.port)`, sets `use_ssl = true` and
`verify_mode = OpenSSL::SSL::VERIFY_PEER` for https, `open_timeout = 1`,
`read_timeout = 10`, and calls `client.post uri, source, headers`. `relay`
(`:36-51`) branches on `Net::HTTPSuccess` / `Net::HTTPUnauthorized`, reads
`response.code`, and rescues `IOError, SocketError, SystemCallError` and
`Timeout::Error`. ruby-compat has `uri/http.ts` and `http-adapter.ts` but no
`Net::HTTP`.

Ruby source: `vendor/ruby/v3.3.11/lib/net/http.rb` — `initialize` (`:1093`),
`read_timeout=` (`:1343`), `use_ssl=` (`:1435`), `verify_mode` (`:1527`),
`start` / `do_start` / `connect` (`:1565-1585`), `post` (`:1972`),
`request` (`:2295`), `send_entity` (`:2318`);
`net/http/responses.rb` (`HTTPSuccess` `:36`, `HTTPUnauthorized` `:490`,
`CODE_TO_OBJ` `:1108`); `net/http/response.rb` (`read_new`'s class lookup
`:165`); `net/protocol.rb` (`OpenTimeout` `:74`, `ReadTimeout` `:80`, both
`< Timeout::Error`).

## Acceptance criteria

- `Net::HTTP`, `Net::HTTPResponse` with the `CODE_TO_OBJ` class hierarchy
  (`instanceof HTTPSuccess` holds for a 2xx), `Net::HTTP::Post`,
  `Net::OpenTimeout` / `ReadTimeout` are ported at Ruby's names in
  ruby-compat over `node:http` / `node:https`, through the existing adapter
  seam so the browser build stays importable.
- `post`, `request` and `start` are async (I/O); the setters are sync.
- `OpenSSL::SSL::VERIFY_PEER` exists on ruby-compat's `openssl.ts`.
- A connection refusal raises an `Errno` (`SystemCallError`), a DNS failure
  `SocketError`, and an elapsed `open_timeout` `Net::OpenTimeout`, each
  tested against a local server.
- Only what `Relayer` calls is ported (ruby-compat README rule 1); the rest
  of `http.rb` is not stubbed.
