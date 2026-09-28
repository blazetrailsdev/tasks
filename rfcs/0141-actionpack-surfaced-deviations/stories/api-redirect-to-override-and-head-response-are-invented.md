---
title: "API#redirectTo override and headResponse are invented surface"
status: draft
updated: 2026-09-28
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while converging status resolution in trails#8202.

- `packages/actionpack/src/action-controller/api.ts` defines its own
  `API#redirectTo(url, { status })` (DoubleRenderError guard, `status ? statusCode(status) : 302`,
  sets `location`, empty body). Rails' `ActionController::API` defines no
  `redirect_to`: it includes `Redirecting` (`vendor/rails/v8.0.2/actionpack/lib/action_controller/api.rb`,
  the `MODULES` list), so `redirect_to` is `Redirecting#redirect_to`
  (`metal/redirecting.rb:103-120`, with `_extract_redirect_to_status` at `:213-221`
  and `_compute_redirect_to_location`). The trails override drops the location
  computation, `_ensure_url_is_http_header_safe`, the flash / allow_other_host
  handling and the `response_body` HTML.
- `packages/actionpack/src/action-controller/metal/head.ts` exports
  `headResponse(status, options)`, which has no callers in `packages/` and no
  Rails counterpart. `Head#head` (`metal/head.rb:23-50`) is already ported on `Metal`.

## Acceptance criteria

- `API` gets `redirect_to` from the ported `Redirecting` module, and the
  `api.ts` override is deleted.
- `headResponse` is deleted.
- `parity:api:extra --package actionpack` drops both names, and the API
  redirect tests still pass against `Redirecting#redirect_to`.
