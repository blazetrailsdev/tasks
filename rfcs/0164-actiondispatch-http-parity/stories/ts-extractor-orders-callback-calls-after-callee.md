---
title: "TS call extractor orders a callback argument's calls after its callee, as Ruby blocks"
status: claimed
updated: 2026-10-15
rfc: "0164-actiondispatch-http-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-10-15T15:55:17Z"
assignee: "http-call-baselines-and-residue"
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/call-mismatches-exclude/actiondispatch/http/request.json` holds
`read_body_stream` `order:read,resetStream`. Rails `ActionDispatch::Request#read_body_stream`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/request.rb:509-519`) calls `body_stream.read`
inside the `reset_stream` block. The TS port (`packages/actionpack/src/action-dispatch/http/request.ts`,
`readBodyStream`) does the same in an arrow argument. `extract-ts-api.ts#collectCalls` records an
argument's calls before the callee, so a block-shaped callback reads as calls made before the call.
The Ruby extractor (`extract-ruby-api.rb#walk_call_in_order`) puts a block's calls after its call.

## Acceptance criteria

- The TS extractor positions calls inside a function-literal argument after the callee, as Ruby's
  block calls are positioned.
- The `read_body_stream` row is deleted, and any other `order:` rows this unmasks or retires are handled
  under the only-shrink rules.
