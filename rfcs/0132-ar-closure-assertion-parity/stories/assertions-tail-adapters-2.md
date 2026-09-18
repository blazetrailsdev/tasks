---
title: "assertion parity tail: adapters files, batch 2"
status: ready
updated: 2026-09-15
rfc: "0132-ar-closure-assertion-parity"
cluster: assertion-parity
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 296
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

This RFC counts assertion parity, not only name parity: a test that matches
Rails by name but asserts a different number or a different kind of assertion
is not a port of that test. `pnpm parity:test -- --package activerecord
--assertions` reports these per file today (report-only,
`scripts/test-compare/compare.ts:606-663`), and RFC 0025's ratchet
(`scripts/test-compare/assertion-mismatch-mark.json`, PR #5790) pins them so
they cannot grow. This story burns down one Rails source cluster.

Measured 2026-08-13 (`pnpm parity:test -- --cached --package activerecord --assertions`):

| Rails test file (under `vendor/rails/activerecord/test/cases/`)  | count | kind | value |
| ---------------------------------------------------------------- | ----: | ---: | ----: |
| `connection_adapters/connection_handlers_sharding_db_test.rb`    |     3 |    9 |     3 |
| `adapters/abstract_mysql_adapter/table_options_test.rb`          |     7 |    8 |     0 |
| `adapters/abstract_mysql_adapter/bind_parameter_test.rb`         |     3 |   10 |     0 |
| `adapters/postgresql/connection_test.rb`                         |     4 |    8 |     0 |
| `adapters/postgresql/datatype_test.rb`                           |     6 |    6 |     0 |
| `adapters/abstract_mysql_adapter/adapter_prevent_writes_test.rb` |     0 |   12 |     0 |
| `adapters/postgresql/money_test.rb`                              |     1 |   10 |     0 |
| `adapters/sqlite3/copy_table_test.rb`                            |     0 |   10 |     0 |
| `adapters/postgresql/timestamp_test.rb`                          |     5 |    5 |     0 |
| `adapters/postgresql/invertible_migration_test.rb`               |     3 |    6 |     0 |
| `adapters/postgresql/hstore_test.rb`                             |     1 |    8 |     0 |
| `adapters/abstract_mysql_adapter/active_schema_test.rb`          |     3 |    6 |     0 |
| `adapters/postgresql/explain_test.rb`                            |     4 |    4 |     0 |
| `adapters/postgresql/date_test.rb`                               |     4 |    4 |     0 |
| `adapters/abstract_mysql_adapter/warnings_test.rb`               |     3 |    5 |     0 |
| `adapters/postgresql/rename_table_test.rb`                       |     4 |    4 |     0 |
| `adapters/postgresql/schema_authorization_test.rb`               |     3 |    5 |     0 |
| `adapters/sqlite3/virtual_column_test.rb`                        |     0 |    8 |     0 |

**185 divergences** (54 assertion-count, 128 assertion-kind, 3
assertion-value). Expand per test with `pnpm parity:test -- --package
activerecord --assertions --missing` and grep for the file; each line prints
`rails N vs trails M`. The trails counterparts are at the convention TS path
the same report prints beside the Ruby file.

The fix direction is Rails-ward: our test asserts what the Rails test asserts,
with the same assertion kinds in the same order (`assert_equal` → `toEqual`,
`assert_nil` → `toBeNull`, `assert_predicate`/`assert` → the mapped kind in
`scripts/test-compare/assertion-kinds.ts`). Where the port legitimately cannot
mirror an assertion — a Ruby-only value protocol, an async surface that needs
`await expect(...)` — say so at the call site in a comment; do not reword the
test name (CLAUDE.md: test names are the parity key).

## A converged assertion that fails is a story, not a detour

Converging a test's assertions regularly surfaces a real production bug: the
test now asserts what Rails asserts, and the port does not do it. **Do not fix
the production code in this PR.** That is what has been slowing this RFC down —
an assertion burndown turns into an unrelated behaviour fix, the PR triples in
size and review rounds, and the rest of the story's files stall behind it.

Instead:

1. **Land the converged body.** The assertions stay exactly as Rails writes
   them — same count, same kinds, same expected values. Do not soften an
   assertion to make it pass, and do not delete it.
2. **Park the test**, converged body intact, as `it.skip` carrying the repo's
   structured skip annotation (`scripts/test-compare/normalize-skips.ts:10-15`)
   with the story you filed named in `SCOPE:`:

   ```ts
   it.skip("rails test name, unchanged", async () => {
     // BLOCKED: <category> — <what the port does instead>
     // ROOT-CAUSE: <file>#<symbol> not implementing <behavior>
     // SCOPE: filed as <rfc>/<story-slug>
     // ...converged body, mirroring the Rails assertions...
   });
   ```

3. **File the story** with `pnpm tasks new <rfc> <slug> --body-file <path>`,
   against the best-fit active RFC for that behaviour, else the package's
   `<package>-surfaced-deviations` bucket — not this RFC, which owns the
   assertion axis only. Capture the trails and Rails `file:line` you already
   have in front of you; a title-only stub forces an expensive re-derivation
   later.
4. **Move on to the next file in the story.**

Prefer `it.skip` with the converged body over `it.todo`: `it.todo` takes no
body, so the mirroring work would be thrown away and redone when the bug is
fixed.

Two mechanical consequences to know before doing this:

- A pending test (`it.skip` / `it.todo`) is excluded from all three assertion
  counters — `isAssertionCountMismatch`, `assertionKindMismatch` and the value
  check all return early on `pending`
  (`scripts/test-compare/compare.ts:526-560`). Parking a test therefore clears
  its rows the same way converging it does, and the name gate still credits it:
  `matched++` runs regardless of pending (`compare.ts:920-928`), so
  `parity:test`'s percent does not drop.
- **Keep the gate wrapper.** If the Rails test is adapter-conditional
  (`current_adapter?(...)`) and you replace a gated trails test with a bare
  `it.skip`, `classifyGateMismatch` scores it `should-gate`
  (`scripts/test-compare/gates.ts:410-424`) and the `Test comparison` CI step
  fails hard — activerecord's gate-mismatch count is a hard zero with no
  baseline. Park it _inside_ its existing `describeIfPg` / `it.skipIf` gate.

Use judgement on size: a one-line production fix you are already sure of is not
worth a story round-trip. Anything needing its own investigation, its own
regression test, or a change outside the file you are converging, is.

## Acceptance criteria

- Every file listed above reports 0 assertion-count, 0 assertion-kind and 0
  assertion-value mismatches in `pnpm parity:test -- --package activerecord
--assertions`.
- The mark file is FROZEN for this RFC by
  `scripts/test-compare/assertion-mismatch-mark.freeze`: do NOT run
  `pnpm parity:test:assertions:reseed` and do NOT hand-edit
  `assertion-mismatch-mark.json`. The gate stays green while the mark carries
  slack; `tighten-assertion-mark-after-0132` lowers it once at the end.
- No test name changes; `pnpm parity:test` percent for activerecord does not
  drop.
- No new rows in `scripts/parity/unported-files/`.
- A converged assertion that fails because of a production bug is parked
  `it.skip` with the structured annotation and a filed story — see "A
  converged assertion that fails is a story, not a detour" above — not fixed
  in this PR.

## LOC limit

**The per-PR LOC limit is LIFTED for RFC 0132.** Stories here may ship as large
a PR as the work honestly needs; do not split a file's burndown, restructure a
test, or leave a remainder unconverged merely to fit a line budget. Every other
constraint (no test renames, mark file only-shrink, no name-gate regression)
still applies.
