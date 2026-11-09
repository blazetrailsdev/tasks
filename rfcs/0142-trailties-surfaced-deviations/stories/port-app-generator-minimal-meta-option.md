---
title: "port-app-generator-minimal-meta-option"
status: in-progress
updated: 2026-11-09
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 7
pr: trails#9934
claim: "2026-11-09T21:05:40Z"
assignee: "trailties-mailer-previews-test-port-remaining"
blocked-by: null
closed-reason: null
---

# Port AppGenerator's `--minimal` meta option and `imply_options(OPTION_IMPLICATIONS, meta_options:)`

## Context

Rails' `AppGenerator::OPTION_IMPLICATIONS` (`railties/lib/rails/generators/rails/app/app_generator.rb:300-326`)
includes a `minimal:` arm listing every skip flag it turns on (`:skip_rubocop` at `:316`),
with `META_OPTIONS = [:minimal]` (`:328`) consumed by `imply_options` in `initialize`
(`:340-345`). trails' `OPTION_IMPLICATIONS` (`packages/trailties/src/generators/app-base.ts`)
has no `minimal` arm and no meta-option handling, so `trails new --minimal` does not exist.
`skipEslint` is now an `AppBase` class option and belongs in that arm.

## Acceptance criteria

- `minimal` is a class option and a meta option, implying the skip flags trails models
  (at least `skipEslint`), mirroring `:300-328`.
- Rails' `test_minimal_rails_app` (`railties/test/generators/app_generator_test.rb:1262-1284`)
  is ported with its `assert_option :skip_rubocop` arm (`:1280`) as `skipEslint`.
