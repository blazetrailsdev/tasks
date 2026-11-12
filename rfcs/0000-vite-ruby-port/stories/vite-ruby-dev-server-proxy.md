---
title: "Port ViteRuby::DevServerProxy onto @blazetrails/rack-proxy"
status: draft
updated: 2026-11-12
rfc: "0000-vite-ruby-port"
cluster: vite-ruby
packages: [vite-ruby]
deps: [rack-proxy-gem-port, vite-ruby-core-package]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/vite_ruby/v3.11.1/vite_ruby/lib/vite_ruby/dev_server_proxy.rb:6-77` covers
`perform_request` (`:17`), `rewrite_uri_for_vite` (`:32`), `normalize_uri`
(`:37`), `forward_to_vite_dev_server` (`:44`), `vite_should_handle?` (`:56`),
`file_in_vite_root?` (`:65`) and `vite_url_prefix` (`:74`). Upstream tests:
`vendor/vite_ruby/v3.11.1/test/dev_server_proxy_test.rb` (18) and `dev_server_test.rb` (9).

## Acceptance criteria

- `packages/vite-ruby/lib/dev-server-proxy.ts` subclasses `Rack::Proxy`
  from `@blazetrails/rack-proxy`, with the same branches in the same order.
- Both upstream test files are ported under their upstream names.
