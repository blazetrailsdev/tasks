---
title: "port-command-recorder-test-cases-part-2"
status: done
updated: 2026-08-07
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 6181
claim: "2026-08-07T16:37:44Z"
assignee: "port-command-recorder-test-cases-part-2"
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `port-command-recorder-test-cases`, which ported the first half of
`vendor/rails/activerecord/test/cases/migration/command_recorder_test.rb`
(through `test_invert_rename_index`, line 353) into the
`Migration > CommandRecorderTest` describe of
`packages/activerecord/src/migration/command-recorder.test.ts` and deleted the
bespoke `invert*`-named duplicates it superseded. `parity:test` for that file
moved from `4 OK / 89 miss / 73 extra` to `42 OK / 51 miss / 47 extra`.

What is left:

- **Rails lines 354-601** — `test_invert_add_timestamps` through
  `test_invert_drop_virtual_table_without_options`: timestamps, references /
  belongs_to aliases, extensions, schemas, foreign keys (incl. the
  irreversible-without-to_table case), `transaction` with an irreversible
  inside, check constraints, unique constraints, enums, and virtual tables.
- **The adapter-gated cases skipped deliberately** so as not to trip the
  gate-mismatch CI gate without a matching TS gate:
  - `test_bulk_invert_change_table` (line 117, `supports_bulk_alter?`) — the
    bespoke `describe("bulk invert change table")` at the bottom of the file
    already covers it and should be renamed once the gate is expressed.
  - the six `supports_comments?` cases (lines 249-278):
    `test_invert_change_column_comment{,_with_from_and_to,_..._with_nil}` and
    `test_invert_change_table_comment{,_with_from_and_to,_..._with_nil}`.
- **The remaining bespoke `invert*` describes** in the top-level
  `describe("CommandRecorder")` — `invertAddTimestamps / invertRemoveTimestamps`,
  `invertAddReference / invertRemoveReference`, `invertAddForeignKey / ...`,
  the check/exclusion/unique-constraint pairs, `invertRemoveColumns`,
  `invertRenameEnum`, `invertRenameEnumValue`, `invertDropEnum`,
  `invertDropVirtualTable`, `joinTableName / findJoinTableName`,
  `invertAddColumns`, and the `change_table` shorthand groups. Each is either
  renamed to its Rails counterpart or, where there is no Rails equivalent
  (`invertAddColumns`, `joinTableName / findJoinTableName`, the adapter
  ColumnMethods shorthand groups), moved to `command-recorder.trails.test.ts`
  per the TS-only-extras convention.

Note the trails `CommandRecorder` records `{ cmd, args }` objects rather than
Rails' `[cmd, args, block]` triples, and a JS callback rides inside `args`; the
ported cases assert that shape.

## Acceptance criteria

- The Rails cases above are ported under `Migration > CommandRecorderTest`,
  names verbatim from `command_recorder_test.rb`.
- Adapter-gated cases carry a TS gate matching the Ruby one (the
  gate-mismatch CI gate is hard).
- The remaining bespoke tests are renamed or moved to
  `command-recorder.trails.test.ts`; no test that currently matches a Rails
  name is renamed away from it.
- `parity:test` for `migration/command_recorder_test.rb` reaches 93 OK /
  0 extra; `parity:api` non-negative.
- Green on sqlite3, PostgreSQL and MySQL.
