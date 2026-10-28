---
title: "Port blob_test.rb and the purge job test"
status: draft
updated: 2026-10-28
rfc: "0000-activestorage-port"
cluster: as-models
packages: ["activestorage"]
deps: ["activestorage-test-helper-and-fixture-set"]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activestorage/test/models/blob_test.rb` has 40 tests over the blob lifecycle
(upload with and without identification, checksums, `open`, `download_chunk`,
`compose`, signed ids, `purge` / `purge_later`, service metadata updates).
`test/jobs/purge_job_test.rb` (2).

## Acceptance criteria

- All 42 tests are ported with Rails' names and pass on all three adapters;
  any test that needs a cloud service is a `PERMANENT-SKIP` citing the
  RFC's non-goals.
