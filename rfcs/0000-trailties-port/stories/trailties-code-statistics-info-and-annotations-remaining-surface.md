---
title: "Port the remaining CodeStatistics, Info and SourceAnnotationExtractor methods"
status: ready
updated: 2026-10-30
rfc: "0000-trailties-port"
cluster: tt-surface
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

parity:api 2026-10-30: `code_statistics.rb` 9 missing, `info.rb` 3 (7/10),
`source_annotation_extractor.rb` 5 (18/23), `initializable.rb` 1 (16/17),
`backtrace_cleaner.rb` and other top-level stragglers.
`vendor/rails/v8.0.2/railties/test/code_statistics_calculator_test.rb` (19 tests) scores 0.

## Acceptance criteria

- The listed files reach 100% in parity:api.
- `code_statistics_test.rb`, `code_statistics_calculator_test.rb`,
  and `rails_info_test.rb` are ported. The annotation tests live in
  `application/configuration_test.rb` and wait for the isolation harness.
  The calculator counts TS/JS, with Rails' Ruby patterns kept where the
  extension is `.rb`.
