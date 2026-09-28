---
title: "Generated CI workflow and manifest run ESLint, not RuboCop"
status: claimed
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: generators
packages:
  - trailties
deps:
  [
    app-generator-writes-an-eslint-config-instead-of-rubocop-yml,
    app-base-declares-a-skip-eslint-class-option,
  ]
deps-rfc: []
est-loc: 140
priority: 3
pr: null
claim: "2026-09-28T17:56:44Z"
assignee: "generated-ci-and-manifest-run-eslint-not-rubocop"
blocked-by: null
closed-reason: null
---

## Context

Three generated files reference RuboCop and all three are gated on the skip flag:

- `templates/github/ci.yml.tt:45,59` — a `lint` job whose step is
  `run: bin/rubocop -f github`, inside `<%- unless skip_rubocop? -%>`.
- `templates/Gemfile.tt:62-65` — `gem "rubocop-rails-omakase", require: false`
  under an "Omakase Ruby styling" comment, inside
  `<%- unless options.skip_rubocop? -%>`.
- `templates/config/environments/development.rb.tt:81,84` — a commented-out
  `# config.generators.apply_rubocop_autocorrect_after_generate!`, which
  `test/isolation/abstract_unit.rb:151` strips when setting up test apps.

The trails analogues are an ESLint step in the generated workflow, an ESLint
devDependency in the generated `package.json` (trails' Gemfile analogue), and the
commented-out `applyEslintAutocorrectAfterGenerateBang` line in the generated
development environment — which only means anything once
`port-apply-rubocop-autocorrect-after-generate` lands, hence the ordering.

## Acceptance criteria

- The generated CI workflow's lint job runs ESLint with a GitHub-annotating
  formatter, gated on the skip flag, in the same position in the file as Rails'.
- The generated dependency manifest declares ESLint (and the config package, if
  the sibling story chose one) under the same skip gate, with a comment mirroring
  Rails' "Omakase Ruby styling" line at the trails equivalent.
- The generated development environment carries the commented-out
  `applyEslintAutocorrectAfterGenerateBang` line, and trails' test-app setup
  strips it the way `abstract_unit.rb:151` does.
- Rails' `test_inclusion_of_rubocop` (`app_generator_test.rb:612-614`) and
  `test_rubocop_is_skipped_if_required` (`:618-623`) are ported with verbatim test
  names.
- Generating an app and running its own lint script passes end to end.
