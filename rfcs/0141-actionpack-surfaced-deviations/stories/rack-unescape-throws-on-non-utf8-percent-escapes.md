---
title: "Rack::Utils.unescape throws on a non-UTF-8 percent-escape; decode_www_form_component is ported twice privately"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rack::Utils.unescape` is `URI.decode_www_form_component(s, encoding)`
(`vendor/rack/v3.1.14/lib/rack/utils.rb:58-60`), which never raises on a non-UTF-8 byte: it
returns the bytes tagged with `encoding` (`vendor/ruby/v3.3.11/lib/uri/common.rb:370-372`,
`:399-402`) and raises `ArgumentError "invalid %-encoding (...)"` only for a malformed `%`.

Two of the three trails decoders now follow that, each as a private copy:

- `Rack::QueryParser`'s private `unescape` (`packages/rack/src/query-parser.ts:296`) decodes
  over `bytes` and raises `ArgumentError` for a malformed `%`.
- `ActionDispatch::QueryParser`'s private `decodeFormComponent`
  (`packages/actionpack/src/action-dispatch/http/query-parser.ts`, trails#8560).

`Rack::Utils.unescape` itself is still `decodeURIComponent(s.replace(/\+/g, " "))`
(`packages/rack/src/utils.ts:89-91`), which throws `URIError` on `%E2`.

## Acceptance criteria

- [ ] `URI.decode_www_form_component` is ported once, in ruby-compat's URI, with its MRI
      citation `uri/common.rb:370-372,399-402`.
- [ ] `Rack::Utils.unescape`, `Rack::QueryParser#unescape` (`query_parser.rb:234-236`) and
      `ActionDispatch::QueryParser.each_pair` (`query_parser.rb:44-45`) all call it; the two
      private copies are deleted.
- [ ] `Rack::Utils.unescape("%E2")` returns without raising and a malformed `%` raises
      `ArgumentError` with Ruby's message; both have a test.
