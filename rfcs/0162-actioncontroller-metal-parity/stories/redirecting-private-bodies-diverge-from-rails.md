---
title: "Redirecting's url-host, location and guard bodies diverge from Rails"
status: draft
updated: 2026-10-07
rfc: "0162-actioncontroller-metal-parity"
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

`packages/actionpack/src/action-controller/metal/redirecting.ts` bodies differ
from `vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/redirecting.rb`.
trails#8619 drove them through `RedirectController` and left the bodies alone.

- `_url_host_allowed?` (`redirecting.rb:231-240`) is
  `host = URI(url.to_s).host`, four ordered returns, and
  `rescue ArgumentError, URI::Error; false`. The port tests a scheme regex,
  parses with WHATWG `URL`, and returns in a different order. WHATWG `URL`
  normalizes `http:///www.rubyonrails.org/` to host `www.rubyonrails.org`, where
  Ruby's `URI` gives an empty host. ruby-compat has `URI` (`uri/generic.ts`,
  `uri/rfc3986-parser.ts`).
- `_compute_redirect_to_location` (`:159-177`) is one `case` ending in
  `.delete("\0\r\n")`. The port's first arm tests `typeof options === "string"`
  before the scheme regex, so a `to_str` object never reaches `options.to_str`
  (`:167`); its `else` arm throws an invented `TypeError` when the host has no
  `urlFor`, where Rails calls `url_for(options)`; its Proc arm returns before
  the `delete`.
- `url_from` (`:203-206`) is `location = location.presence`. The port tests
  `!location || location.trim() === ""`.
- `_enforce_open_redirect_protection` (`:223-229`) is
  `location.truncate(100).inspect`. The port slices by hand and uses
  `JSON.stringify`.
- `redirect_back_or_to` (`:149-157`) takes `allow_other_host:` as a kwarg
  defaulting to `_allow_other_host`. The port reads it with `Object.hasOwn`.
- `redirect_to`'s guards (`:103-120`) are `raise … unless options` and
  `raise AbstractController::DoubleRenderError if response_body`. The port tests
  `this.responseBody != null`.

## Acceptance criteria

- Each body above mirrors its Rails body: same branches in the same order, the
  same calls (`URI`, `presence`, `truncate`, `inspect`, `url_for`), the same
  rescue.
- `test_redirect_to_url_with_stringlike` (`redirect_test.rb:333-337`) passes
  with an object that defines only `toStr`.
- `pnpm parity:api:calls` and `parity:api:arms` show no row for the file.
