---
title: "Trailties assertion receipt cites the wrong base_test line"
status: draft
updated: 2026-10-31
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 1
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/test-compare/assertion-receipts/trailties.ts:10` (trails#9542) cites `command/base_test.rb:13` in its reason. That line is in another test. The assertion is `assert_equal "FOO custom_bin", Rails::Command::CustomBinCommand.executable` at `vendor/rails/v8.0.2/railties/test/command/base_test.rb:94`. The row's key and value are correct.

## Acceptance criteria

- The reason cites `command/base_test.rb:94`.
