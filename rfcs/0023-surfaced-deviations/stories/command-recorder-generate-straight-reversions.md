---
title: "command-recorder-generate-straight-reversions"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Not Rails-convergent: behavior-identical restructuring of hand-written invert* methods into a class_eval-style generated table (command_recorder.rb:154-183). The real gap it surfaced — the three missing StraightReversions entries — was already closed by port-command-recorder-test-cases-part-2."
---

## Context

`packages/activerecord/src/migration/command-recorder.ts` hand-writes one
`invert<Cmd>` method per straight reversion (`invertEnableExtension`,
`invertDisableExtension`, `invertCreateEnum`, `invertCreateSchema`,
`invertDropSchema`, `invertCreateVirtualTable`, `invertAddTimestamps`, …).

Rails generates all of them from a single table in a private
`StraightReversions` module, `class_eval`'d over a 14-entry Hash
(`vendor/rails/activerecord/lib/active_record/migration/command_recorder.rb:154-183`),
and mixes it in with `include StraightReversions` (`:184`). Both directions of
each pair come from the one entry, so the pairs cannot drift.

The hand-written form is how the gap was found: porting
`test_invert_create_schema` / `test_invert_drop_schema` /
`test_invert_create_virtual_table` (PR for
`port-command-recorder-test-cases-part-2`) showed three of the table's entries
had simply never been written out, and the tests failed until they were added
by hand. A generated table would have had them from the start.

## Acceptance criteria

- The straight reversions are generated from one Rails-shaped table keyed by
  the Rails command names, rather than written out one method at a time.
- Every entry of Rails' `StraightReversions` hash is present, both directions.
- The non-straight overrides (`invertCreateTable`, `invertDropTable`,
  `invertRemoveIndex`, `invertAddForeignKey`, …) keep their hand-written bodies,
  as in Rails.
- `migration/command-recorder.test.ts` and `.trails.test.ts` stay green;
  `parity:api` / `parity:api:extra` non-negative.
