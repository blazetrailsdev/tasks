---
title: "Head#head turns a camelCase option key into Rails' dashed header name"
status: done
updated: 2026-10-07
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8643
claim: "2026-10-07T16:33:20Z"
assignee: "default-helper-module-raises-for-binding-named-controller-class"
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActionController::Head#head` turns each remaining option key into a
header name with `key.to_s.split(/[-_]/).each { |v| v[0] = v[0].upcase }.join("-")`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/head.rb:33-35`), so
`head :ok, x_custom_header: "1"` sends `X-Custom-Header`.

trails' port (`packages/actionpack/src/action-controller/metal/head.ts`, `head`)
keeps the same `split(/[-_]/)`, but a trails option hash is keyed by the
camelCase spelling of the Symbol's name (CLAUDE.md, "`symbolize_keys` on an
option hash"): `location` and `content_type` are already read as `location` /
`contentType`. So `head("ok", { xCustomHeader: "1" })` sends `XCustomHeader`,
and only a caller who spells the key `x_custom_header` or `"x-custom-header"`
gets Rails' header.

## Acceptance criteria

- A camelCase option key produces the header Rails produces for its snake_case
  Symbol (`xCustomHeader` sends `X-Custom-Header`), while `x_custom_header` and
  `"x-custom-header"` keep working.
- A test in `rendering.test.ts` (or the Rails-named test that covers it) pins
  the three spellings.
