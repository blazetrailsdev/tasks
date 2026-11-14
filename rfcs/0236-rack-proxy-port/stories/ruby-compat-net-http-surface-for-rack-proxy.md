---
title: "ruby-compat-net-http-surface-for-rack-proxy"
status: ready
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

`Rack::Proxy#perform_request` and `#configure_backend_connection`
(`vendor/rack-proxy/v2.0.1/lib/rack/proxy.rb:236-363`, `:415-440`) and
`Rack::HttpStreamingResponse` (`lib/rack/http_streaming_response.rb`) drive
Ruby's `Net::HTTP`. ruby-compat's port (`packages/ruby-compat/lib/net/http.ts`,
`net/http/request.ts`, `net/http/response.ts`) has only `Net::HTTP::Post`, and
lacks every other piece rack-proxy calls.

## Acceptance criteria

- ruby-compat gains, ported from `vendor/ruby/v3.3.11/lib/net/http*.rb` at their MRI names:
  the request classes `Get`, `Head`, `Put`, `Delete`, `Patch`, `Options`,
  `Trace` (and the rest of `net/http/requests.rb`), so
  `Net::HTTP.const_get(method.capitalize, false)` resolves them;
  `HTTPGenericRequest#initialize_http_header`, `#basic_auth`, `#body_stream=`,
  `#content_length=`, `#content_type=`, `#request_body_permitted?`,
  `#response_body_permitted?`; `HTTPResponse#read_body` with a block and
  `#to_hash`; `HTTP#open_timeout=`, `#write_timeout=`, `#verify_mode=`,
  `#ca_file=`, `#cert_store=`, `#min_version=`, `#max_version=`,
  `#ssl_version=`, `#cert=`, `#key=`, `#set_debug_output`.
- Each is covered by a ruby-compat test citing its MRI line.
