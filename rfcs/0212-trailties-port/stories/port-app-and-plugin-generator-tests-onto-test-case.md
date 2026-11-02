---
title: "Port app and plugin generator tests onto TestCase"
status: done
updated: 2026-11-02
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 700
priority: null
pr: trails#9635
claim: "2026-11-02T17:56:45Z"
assignee: "rake-command-printing-commands-and-invoke-rake"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/test/generators/app_generator_test.rb` (146 tests), `api_app_generator_test.rb` (9) and `plugin_generator_test.rb` (80). More than one PR: split on first pickup.

Sizing comes from the pilot `trailties-port-generator-tests-onto-generators-test-case`: about 9 LOC per Rails test on `controller_generator_test.rb`, about 33 on `scaffold_generator_test.rb`.

## Acceptance criteria

- Each named Rails file is ported onto `TestCase` with `copyRoutes` from `generators-test-helper.ts`, test names verbatim, and ad-hoc helpers and snapshots it replaces are deleted.
