---
title: "Net::HTTP request body_data arm (set_form, send_request_with_body_data)"
status: done
updated: 2026-11-16
rfc: "0236-rack-proxy-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#10155
claim: "2026-11-15T22:05:47Z"
assignee: "rack-proxy-perform-request"
blocked-by: null
closed-reason: null
---

## Context

`HTTPGenericRequest#exec` (`vendor/ruby/v3.3.11/lib/net/http/generic_request.rb:198-208`) has a
third arm, `@body_data` → `send_request_with_body_data` (`:285-311`), fed by
`set_form` / `set_form_data` (`header.rb:900-940`), with
`encode_multipart_form_data` / `quote_string` / `flush_buffer` (`:313-370`).
trails' `exec` and `setBodyInternal` (`packages/ruby-compat/lib/net/http/request.ts`)
have no `@body_data`, so `set_body_internal`'s `@body_data.nil?` guard (`:186-191`) is
missing too.

## Acceptance criteria

- Port `set_form`, `set_form_data` / `form_data=`, `@body_data`, and `exec`'s body_data arm with `send_request_with_body_data` and its multipart helpers, names and branch order as in Ruby.
- `setBodyInternal` checks `bodyData == null` as `generic_request.rb:188` does.
- A test posts urlencoded and multipart form data against a raw `net` server and compares bytes.
