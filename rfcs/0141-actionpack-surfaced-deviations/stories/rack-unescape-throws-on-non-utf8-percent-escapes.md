---
title: "Rack::Utils.unescape and Rack::QueryParser throw on a non-UTF-8 percent-escape"
status: draft
updated: 2026-10-06
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rack::Utils.unescape` is `URI.decode_www_form_component(s, encoding)`
(`vendor/rack/v3.1.14/lib/rack/utils.rb:58-60`; `Rack::QueryParser#unescape`, `vendor/rack/v3.1.14/lib/rack/query_parser.rb:234-236`), which never raises on a non-UTF-8 byte: it
returns the bytes tagged with `encoding` (`vendor/ruby/v3.3.11/lib/uri/common.rb:370-372`,
`:399-402`) and raises `ArgumentError "invalid %-encoding (...)"` only for a malformed `%`.

trails' rack port decodes with `decodeURIComponent`, which throws `URIError` on any byte
sequence that is not valid UTF-8: `packages/rack/src/utils.ts:108-110` (`unescape`),
`packages/rack/src/query-parser.ts:297-299` (the query parser's private `unescape`, used at
`:113-117,146-150`). So `?bar=%E2` raises in `Rack::QueryParser` where Rack parses it.

trails#8560 fixed the same divergence in ActionDispatch only, with a private
`decodeFormComponent` in `packages/actionpack/src/action-dispatch/http/query-parser.ts` that
ports `URI.decode_www_form_component` over ruby-compat's `bytes` / `strNew` (an invalid byte is
carried as a lone surrogate `U+DC80..U+DCFF`).

## Acceptance criteria

- [ ] `URI.decode_www_form_component` is ported once, in ruby-compat, with its
      `@noRailsEquivalent PERMANENT` receipt citing `uri/common.rb:370-372,399-402`.
- [ ] `Rack::Utils.unescape`, the rack query parser and
      `ActionDispatch::QueryParser.each_pair` (`query_parser.rb:44-45`) all call it; the private
      copies are deleted.
- [ ] A non-UTF-8 percent-escape parses through `Rack::QueryParser` and a malformed `%` raises
      `ArgumentError` with Ruby's message; both have a test.
