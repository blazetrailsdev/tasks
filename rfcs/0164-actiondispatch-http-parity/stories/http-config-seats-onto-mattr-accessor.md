---
title: "Declare the HTTP layer's config seats with mattrAccessor / cattrAccessor"
status: draft
updated: 2026-09-27
rfc: "0164-actiondispatch-http-parity"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api --package actiondispatch` reports 26 missing rows that are
config seats Rails declares with `mattr_accessor` / `cattr_accessor`, and trails
keeps as plain fields (e.g. `secureProtocol: false` / `tldLength: 1` on the
`URL` object at `packages/actionpack/src/action-dispatch/http/url.ts:145-146`).
Under `vendor/rails/v8.0.2/actionpack/lib/action_dispatch/`:

| Seat                                 | Rails declaration                               | Rows                     |
| ------------------------------------ | ----------------------------------------------- | ------------------------ |
| `strict_freshness`                   | `mattr_accessor`, `http/cache.rb:12`            | 6 (cache.rb, request.rb) |
| `secure_protocol`                    | `mattr_accessor`, `http/url.rb:14`              | 6 (url.rb, request.rb)   |
| `tld_length`                         | `mattr_accessor`, `http/url.rb:15`              | 2 (declaration-only)     |
| `ignore_accept_header`               | `mattr_accessor`, `http/mime_negotiation.rb:20` | 2                        |
| `strict_query_string_separator`      | `cattr_accessor`, `http/query_parser.rb:12`     | 2                        |
| `ignore_leading_brackets`, `default` | `cattr_accessor`, `http/param_builder.rb:19,23` | 4                        |
| `default_charset`, `default_headers` | `cattr_accessor`, `http/response.rb:88-89`      | 4                        |
| `perform_deep_munge`                 | `mattr_accessor`, `request/utils.rb:10`         | 2                        |

The credited idiom is already in the package:
`cattrAccessor.call(this, "rescueResponses", { default: … })`
(`action-dispatch/middleware/exception-wrapper.ts:72`).

## Acceptance criteria

- Each seat is declared with the Rails primitive at the Rails declaration site,
  with Rails' default, and every reader and writer in the package goes through
  it.
- `pnpm parity:api --package actiondispatch` reports none of these rows.
