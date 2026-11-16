---
title: "CustomParamEncoder is not reached for POST params (Mailgun body-mime)"
status: draft
updated: 2026-11-16
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

Found while attempting `ascii-8bit-param-encoding-answers-a-js-string-not-bytes` in trails#10188. In the parked Mailgun test (`packages/actionmailbox/test/controllers/ingresses/mailgun/inbound-emails-controller.test.ts:88`), the `CustomParamEncoder.encodeForTemplate` callback (`packages/actionpack/lib/action-dispatch/request/utils.ts:65-92`) is never reached for `body-mime`. A debug log inside it never fired. The stored raw email had every byte >= 0x80 doubled: 1126 bytes against the fixture's 1112, with 14 high bytes in `invalid_utf.eml`. So the bytes are already UTF-8-encoded one character per byte before the encoder could act.

Rails applies `param_encoding` in `ActionDispatch::Request#path_parameters` / `GET` / `POST` through `Utils.set_binary_encoding` / `CustomParamEncoder.encode` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/request.rb`, `request/utils.rb:85-112`).

## Acceptance criteria

- Find where the POST params bypass `CustomParamEncoder.encode` (or where the controller's `action_encoding_template` answers nil) and route them through it, as Rails does.
- Then the ASCII-8BIT arm can answer a `Uint8Array` (blocks `ascii-8bit-param-encoding-answers-a-js-string-not-bytes`).
