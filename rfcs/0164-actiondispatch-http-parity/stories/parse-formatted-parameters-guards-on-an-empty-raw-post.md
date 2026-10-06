---
title: "parse_formatted_parameters has an invented empty-raw_post guard"
status: draft
updated: 2026-10-06
rfc: "0164-actiondispatch-http-parity"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Http::Parameters#parse_formatted_parameters`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/parameters.rb:89-100`)
opens with one guard: `return yield if content_length.zero? || content_mime_type.nil?`.

`parseFormattedParameters`
(`packages/actionpack/src/action-dispatch/http/parameters.ts`) adds a third
disjunct, `|| !this.rawPost`, which Rails does not have: a request with a
non-zero `content_length` and an empty body falls back instead of reaching the
parser strategy (and so its `ParseError` arm). trails PR 8569 converged the
method's rescue but left this guard.

## Acceptance criteria

- [ ] The guard is `this.contentLength === 0 || this.contentMimeType === null`
      only; the strategy is called with `this.rawPost` as `:95` does.
- [ ] Any test that relied on the extra disjunct is fixed at its cause.
