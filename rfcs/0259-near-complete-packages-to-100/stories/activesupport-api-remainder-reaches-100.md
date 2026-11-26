---
title: "activesupport-api-remainder-reaches-100"
status: claimed
updated: 2026-11-26
rfc: "0259-near-complete-packages-to-100"
cluster: null
packages: []
deps:
  - activesupport-reaches-100
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-26T01:59:56Z"
assignee: "activesupport-api-remainder-reaches-100"
blocked-by: null
closed-reason: null
---

## Context

Split from `activesupport-reaches-100` (LOC ceiling). `pnpm parity:api --missing --package activesupport`
still lists 19 members. Paths under `vendor/rails/v8.0.5.2/activesupport/lib/active_support/`:

- `cache/coder.rb:106-118` `LazyEntry#value` / `#mismatched?`: ported in
  `packages/activesupport/lib/cache/coder.ts:191-222`, but inside a lazily created class
  expression the extractor cannot see. Hoist the class or teach the extractor.
- `core_ext/date_time/compatibility.rb` `to_time`, `core_ext/date_time/conversions.rb` `inspect`,
  `core_ext/time/calculations.rb` `at`, `core_ext/time/compatibility.rb` `to_time`
- `core_ext/hash/conversions.rb` `to_xml`, `core_ext/string/behavior.rb` `acts_like_string?`
- `core_ext/thread/backtrace/location.rb` `spot`
- `current_attributes.rb:186-199` `method_added`; with it the test
  `current_attributes_test.rb:276` "instance delegators are eagerly defined". JS has no
  `method_added` hook: follow the explicit-`methodAdded` shape trailties uses for Thor.
- `descendants_tracker.rb` `initialize`, `include?`; `encrypted_configuration.rb` `message`
- `execution_wrapper.rb` `complete!`; `fork_tracker.rb` `_fork`
- `json/encoding.rb` `encode`, `dump`; `test_case.rb` `run_order`; `xml_mini/rexml.rb` `require_rexml`

Also left from the same story: `inflector_test.rb:456` "safe constantize treats load error
constant name as literal". The `LoadError` rescue arm (`inflector/methods.rb:320-323`) is now
ported in `packages/activesupport/lib/inflector.ts`, but the test stubs
`ActiveSupport::Inflector.constantize`. An ESM export cannot be stubbed, and
`constantize("Example.Channel")` raises `NameError` (wrong constant name) before reaching
`const_missing`. A way to raise `LoadError` from `constantize` is needed first.

## Acceptance criteria

- [ ] Each member listed above is ported at its Rails name, credited by an extractor fix, or
      given a reasoned `SCOPED_SKIP_GROUPS` / `unported-files` entry.
- [ ] "instance delegators are eagerly defined" and "safe constantize treats load error
      constant name as literal" are ported or receipted with a CLAUDE.md citation / ruling.
- [ ] `methodsMissing` is 0 for `activesupport`.
