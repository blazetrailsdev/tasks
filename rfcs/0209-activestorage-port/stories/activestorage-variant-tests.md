---
title: "Port the variant, variant-with-record, representation and transform-job tests"
status: in-progress
updated: 2026-11-03
rfc: "0209-activestorage-port"
cluster: as-variants
packages: ["activestorage"]
deps: ["activestorage-variation-and-variants", "activestorage-test-helper-and-fixture-set"]
deps-rfc: []
est-loc: 600
priority: null
pr: trails#9677
claim: "2026-11-03T17:42:28Z"
assignee: "activestorage-variant-tests"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activestorage/test/models/variant_test.rb` (27), `variant_with_record_test.rb` (9),
`representation_test.rb` (5), `test/jobs/transform_job_test.rb` (4). The
variant tests read processed images with `read_image` (`test_helper.rb:69-71`,
`MiniMagick::Image.open`) and compare dimensions and formats.

## Acceptance criteria

- All 45 tests are ported with Rails' names and pass with both variant
  processors where Rails runs both.
- The `attachment_test.rb` variant arms deferred by the attachment story
  pass.
