---
title: "Port the nine empty attachment_test.rb stubs"
status: claimed
updated: 2026-11-17
rfc: "0219-actiontext-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: "2026-11-17T18:51:48Z"
assignee: "actiontext-engine-and-attachable-methods-credited"
blocked-by: null
closed-reason: null
---

## Context

`packages/actiontext/test/unit/attachment.test.ts:6-22` holds nine empty `it.skip` stubs, left by trails#9986, with no reason and no owning story. Rails: `vendor/rails/v8.0.2/actiontext/test/unit/attachment_test.rb` ("from_attachable", "proxies missing methods to attachable", "proxies #to_param to attachable", "converts to TrixAttachment", "converts to TrixAttachment with content", "converts to plain text", "converts HTML content attachment", "renders content attachment", "to_trix_html sanitizes action-text HTML content attachment"). `pnpm parity:test --package actiontext` reports 1/10 running for this file.

## Acceptance criteria

- Port all nine bodies from `attachment_test.rb`, with names verbatim and canonical dummy models/fixtures.
- Where a body is truly blocked, it keeps `it.skip` under a cited blocker; it is never left as an empty stub.
