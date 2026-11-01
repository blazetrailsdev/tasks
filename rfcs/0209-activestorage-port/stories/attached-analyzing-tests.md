---
title: "attached-analyzing-tests"
status: in-progress
updated: 2026-11-01
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: trails#9560
claim: "2026-11-01T01:54:44Z"
assignee: "testtask-direct-loader-libs-reach-load-path"
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
