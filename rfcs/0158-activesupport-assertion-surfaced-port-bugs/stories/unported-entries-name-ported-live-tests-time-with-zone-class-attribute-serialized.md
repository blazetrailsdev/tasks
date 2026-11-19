---
title: "unported-files entries still name live tests (time_with_zone yaml, class attribute, serialized_attribute)"
status: in-progress
updated: 2026-11-19
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#10358
claim: "2026-11-19T14:31:38Z"
assignee: "date-and-time-calculations-drops-eager-date-time-imports"
blocked-by: null
closed-reason: null
---

## Context

`scripts/parity/unported-live-test.test.ts` fails on main. Several `tests:` entries in the unported-files registry still name tests that are now ported live, so `parity:test` subtracts them from the Ruby count and the live TS tests score as `extra (TS only)`. These were surfaced while landing trails#9755 (the share_lock half of the same problem):

- `scripts/parity/unported-files/activesupport.ts:234`, `core_ext/class/attribute_test.rb` lists "works well with module singleton classes". It is live at `packages/activesupport/src/core-ext/class/attribute.test.ts:130`.
- `scripts/parity/unported-files/activesupport.ts:287` and `:296`, `core_ext/time_with_zone_test.rb` lists "to yaml", "ruby to yaml", "yaml load" and "ruby yaml load". They are live at `packages/activesupport/src/core-ext/time-with-zone.test.ts:306-345`.
- `scripts/parity/unported-files/unscoped.ts`, `serialized_attribute_test.rb` lists about 10 tests that are now ported ("decorated type with decorator block", "serialized class attribute", "is not changed when stored blob" and others). Run the test for the full list.

The Rails tests are in `vendor/rails/v8.0.2/activesupport/test/core_ext/class/attribute_test.rb`, `.../core_ext/time_with_zone_test.rb` and `vendor/rails/v8.0.2/activerecord/test/cases/serialized_attribute_test.rb`.

## Acceptance criteria

- Remove each name the mirroring TS file defines as a live test, together with any `unported-files/baseline.json` row. Keep only names that are still `it.skip`. Where the TS test of that name is not the Rails test, record a `liveTsCounterpart` receipt instead.
- `pnpm vitest run scripts/parity/unported-live-test.test.ts` passes.
- Fix any assertion-ratchet growth the newly matched tests expose by converging the test bodies to Rails, as trails#9755 did for "sharing blocks exclusive".
