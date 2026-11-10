---
title: "Port rack's spec_static dot-segment admin-header tests and the Response headers-hash test, and move the misplaced mock-request test"
status: draft
updated: 2026-11-09
rfc: "0000-small-gem-tail-parity"
cluster: null
packages:
  - "rack"
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test` rack 941/960. Outside multipart (owned below):
`vendor/rack/v3.2.8/test/spec_static.rb` "applies admin header rules for a
dot-segment path" (:333) and its three encoded variants (:339, :345, :351);
`spec_response.rb` "raises ArgumentError unless headers is a hash" (:21); and
"should handle :input object that does not respond to set_encoding" sits in
`packages/rack/test/mock-request.trails.test.ts` instead of `mock-request.test.ts`.

## Acceptance criteria

- [ ] The five tests are ported by name; a failure is fixed in the port.
- [ ] The mock-request test moves to `mock-request.test.ts`.
