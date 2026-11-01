---
title: "attached-analyzing-tests"
status: ready
updated: 2026-10-31
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The analyzers landed with `activestorage-image-analyzers`. Six `it.skip` tests in
`packages/activestorage/src/attached/one.test.ts` (the "analyzing a ... blob after attaching it"
family) and two in `attachment.test.ts` have empty bodies and were blocked on them.
Rails: `vendor/rails/v8.0.2/activestorage/test/models/attached/one_test.rb`,
`test/models/attachment_test.rb`.

## Acceptance criteria

- The skipped tests are ported with the Rails bodies and pass.
