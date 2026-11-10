---
title: "Port StringDeduper, RubyCoreSupport.untaint and TZInfo.eager_load!, with the version, Ruby-Time and city-zone tests"
status: draft
updated: 2026-11-10
rfc: "0231-tzinfo-to-parity"
cluster: null
packages:
  - "tzinfo"
deps:
  - "tzinfo-timezone-reads-the-data-source"
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

No TS files for `vendor/tzinfo/v2.0.6/lib/tzinfo/string_deduper.rb` (4) and `ruby_core_support.rb`
(1, `untaint`); `tzinfo.rb` is 0/1 (`eager_load!`). Tests: `tc_string_deduper.rb`,
`tc_ruby_core_support.rb`, `tc_tzinfo.rb`, `tc_version.rb`,
`tc_ruby_time_timezone.rb`, and the end-to-end `tc_timezone_london.rb`,
`tc_timezone_melbourne.rb`, `tc_timezone_new_york.rb`.

## Acceptance criteria

- [ ] `string_deduper.rb` (`StringDeduper`), `ruby_core_support.rb`
      (`RubyCoreSupport.untaint`, a no-op on Ruby 3 as in the gem) and
      `TZInfo.eager_load!` in `tzinfo.rb` are ported.
- [ ] The eight test files are ported by name.
