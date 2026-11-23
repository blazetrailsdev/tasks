---
title: "Port IntegrationRequestEncodersTest#test_encoding_as_html"
status: draft
updated: 2026-11-23
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails v8.0.5.2 adds `test_encoding_as_html` to `IntegrationRequestEncodersTest`
(`vendor/rails/v8.0.5.2/actionpack/test/controller/integration_test.rb:1179-1188`),
with a `foos_html` action rendering `render inline: "<code><%= params.permit(:foo) %></code>"`
(`:1144-1148`). It exercises `RequestEncoder.register_encoder :html` with
`param_encoder: -> param { param }` and `content_type: Mime[:url_encoded_form].to_s`
(`vendor/rails/v8.0.5.2/actionpack/lib/action_dispatch/testing/request_encoder.rb:56-58`),
which trails#10671 ported in `packages/actionpack/lib/action-dispatch/testing/request-encoder.ts`.
The test was not ported because `render inline:` raises `NotImplementedError` in trails
(packages/actionview/CLAUDE.md, "Templates are precompiled").

## Acceptance criteria

- [ ] `it("encoding as html")` in `packages/actionpack/test/action-controller/controller/integration.test.ts`, asserting Rails' media type, accept, format ref, request parameters and parsed `<code>` text, with `foos_html` rendering a file-backed fixture template in place of `render inline:` (or the test parked under a `PERMANENT-SKIP:` line citing the actionview section if no file-backed fixture fits).
