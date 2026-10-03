---
title: "activemodel: LintTest runs Lint::Tests against CompliantModel under the Rails test names"
status: ready
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails PR 8448. `activemodel/test/cases/lint_test.rb`
(`vendor/rails/v8.0.2/activemodel/test/cases/lint_test.rb:5-21`) is a
`LintTest` that includes `ActiveModel::Lint::Tests` and runs them against a
`CompliantModel` (`extend ActiveModel::Naming`, `include ActiveModel::Conversion`,
`persisted?` false, `errors` a `Hash.new([])`). So its tests are the six
`test_*` methods of `lint.rb:30-106` themselves: `to_key`, `to_param`,
`to_partial_path`, `persisted?`, `model_naming`, `errors_aref`.

`packages/activemodel/src/lint.test.ts` instead holds hand-built object
fixtures under invented names ("passes when persisted returns key and
unpersisted returns null", …), covers only four of the six, and never runs the
lint against a real `Naming` + `Conversion` model. After PR 8448 the `Tests`
functions call the ActiveSupport assertions and require `to_model`, so a
`CompliantModel` port can run them directly.

## Acceptance criteria

- [ ] `lint.test.ts` is `describe("LintTest")` with a `CompliantModel` mirroring
      `lint_test.rb:8-17`, and one test per `Lint::Tests` method under the Rails
      name, each calling the ported `Tests.test*` on it.
- [ ] The fixture-object tests that are trails-only move to
      `lint.trails.test.ts` or are deleted where the `LintTest` port covers them.
- [ ] `pnpm parity:test` credits the six tests.
