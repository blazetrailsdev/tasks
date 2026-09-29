---
title: "TestCase#process sends format: as an Accept header instead of params[:format]"
status: draft
updated: 2026-09-29
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActionController::TestCase::Behavior#process`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/test_case.rb:512-548`) treats
`format:` as a path parameter. It sets `format ||= as` and then
`parameters[:format] = format` (`:536-546`). Negotiation then sees it through
`request.format` / `params[:format]`, and the Accept header is left alone.

trails' `TestCase#process` (`packages/actionpack/src/action-controller/test-case.ts`,
`const resolvedFormat = format ?? as; if (resolvedFormat) env.HTTP_ACCEPT = formatToMime(resolvedFormat);`)
turns the format into an `HTTP_ACCEPT` header through an invented `formatToMime` table. This path
differs from Rails wherever `params[:format]` and the Accept header disagree: for example
`xhr`, `ignore_accept_header`, a browser-like Accept alongside `format:`, or code that reads
`params[:format]`. trails#8239's `variant inline syntax with format` and
`format any variant any` pass only because `text/javascript` is what both paths negotiate.

## Acceptance criteria

- `process` merges `format` (after `format ||= as`) into the request parameters as
  `format`, and stops writing `HTTP_ACCEPT` from it.
- `formatToMime` is deleted if nothing else uses it. `as:` still sets `CONTENT_TYPE` from
  `Mime[as]`, as in `:536-537`.
- The existing `get(..., { format: "js" })` callers in the actionpack tests stay green.
