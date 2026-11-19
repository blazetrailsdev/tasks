---
title: "test-compare-drops-enclosing-module-from-describe"
status: draft
updated: 2026-11-18
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`parity:test --package actionmailbox` reports one WRONG DESCRIBE:

    unit/test-helper.test.ts  "multi-part mail can be built in tests using a block"
      ruby:  testhelpertest > …
      ts:    actionmailbox::testhelpertest > …

Rails nests the class, `module ActionMailbox; class TestHelperTest < ActiveSupport::TestCase`
(`vendor/rails/v8.0.2/actionmailbox/test/unit/test_helper_test.rb:5-6`), so the FQN is
`ActionMailbox::TestHelperTest`, which is what the TS describe says
(`packages/actionmailbox/test/unit/test-helper.test.ts:10`). The siblings that pass write
`class ActionMailbox::MigrationsTest` inline (`migrations_test.rb:6`). So
`scripts/test-compare/extract-ruby-tests.rb` drops an enclosing `module` from the describe
name for a test class (see `process_module`, ~:507). This was found on trails#10299, which
reverted a describe rename that only worked around the extractor.

## Acceptance criteria

- The Ruby extractor names a test class nested in `module X ... end` as `X::Y`, as Ruby does.
- `pnpm parity:test --package actionmailbox` reports 0 wrong describe, with the TS describe
  still `ActionMailbox::TestHelperTest`.
- The repo-wide wrong-describe and matched counts are checked before and after, and every
  moved row is explained.
