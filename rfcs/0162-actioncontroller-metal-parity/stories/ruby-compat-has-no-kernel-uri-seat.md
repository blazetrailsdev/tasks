---
title: "ruby-compat has no Kernel#URI seat, so _url_host_allowed? calls URI.parse"
status: draft
updated: 2026-10-10
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionController::Redirecting#_url_host_allowed?`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/redirecting.rb:232`)
calls `URI(url.to_s)`, the `Kernel#URI` function
(`vendor/ruby/v3.3.11/lib/uri/common.rb`, `def URI(uri)`): it returns a
`URI::Generic` argument unchanged, parses a String (or `to_str` object) with
`URI.parse`, and raises `ArgumentError` "bad argument (expected URI object or
URI string)" for anything else.

ruby-compat has `URI.parse` and no `Kernel#URI` seat, so the port
(`packages/actionpack/src/action-controller/metal/redirecting.ts`,
`_urlHostAllowed`, trails#8758) writes `URI.parse(String(url))`. The
`ArgumentError` half of Rails' `rescue ArgumentError, URI::Error` (`:238`) is
therefore never raised by the call it guards. The same spelling is used in
`action-dispatch/http/filter-redirect.ts:47` and
`action-controller/metal/request-forgery-protection.ts:741,753`; check each
against its Rails line before changing it, since some of those are
`URI.parse` in Rails too.

## Acceptance criteria

- ruby-compat exports the `Kernel#URI` function with MRI's three arms, cited to
  `vendor/ruby/v3.3.11/lib/uri/common.rb`.
- `_urlHostAllowed` calls it where `redirecting.rb:232` calls `URI(...)`.
- Any other actionpack site whose Rails line is `URI(...)` calls it too.
