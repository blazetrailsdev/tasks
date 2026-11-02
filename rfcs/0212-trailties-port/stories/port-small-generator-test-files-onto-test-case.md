---
title: "Port the small generator test files onto TestCase"
status: claimed
updated: 2026-11-02
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: "2026-11-02T18:46:45Z"
assignee: "zeitwerk-multiple-loaders-tests"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/test/generators`: mailer (14), helper, job, generator_generator, integration_test, system_test, benchmark, task, script, hook, application_record, multi_db, db_system_change, action_text_install, action_mailbox_install.

Sizing comes from the pilot `trailties-port-generator-tests-onto-generators-test-case`: about 9 LOC per Rails test on `controller_generator_test.rb`, about 33 on `scaffold_generator_test.rb`.

## Acceptance criteria

- Each named Rails file is ported onto `TestCase` with `copyRoutes` from `generators-test-helper.ts`, test names verbatim, and ad-hoc helpers and snapshots it replaces are deleted.
