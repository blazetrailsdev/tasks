---
title: "assertions-postgresql-adapter-tail"
status: ready
updated: 2026-09-20
rfc: "0132-ar-closure-assertion-parity"
cluster: assertion-parity
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: null
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## How to work this story

Read this before the measurements below. It is the whole operating procedure,
and it does not vary by story.

1. **The default is to finish the story in one PR.** Take the whole file. These
   PRs are big by design — the LOC ceiling is lifted for this RFC precisely so a
   file's burndown is not sliced up — and the ones that land clean are in the
   **1,000–2,500 LOC** band: trails#7867 (1,202), trails#7868 (2,001),
   trails#7870 (2,406), trails#7871 (2,471), trails#7872 (1,933).
2. **Split only if the story is over the threshold** in the RFC's "Finish the
   story or split it" (~250 mismatches or ~150 tests in one Rails file). Then
   take a slice of **~250 mismatches / ~1,200 LOC** — a slice is a large PR too.
   Re-measure, file the remainder with everything you learned, open the PR.
3. **Either way the story ends here**: 0 mismatches, or a converged slice plus a
   filed remainder. A story in this RFC is never handed back unfinished.

**Do not open a partial PR under ~300 LOC.** Below that the split has cost more
than it saved — a CI run, a review round and a remainder story, for a fraction
of one file.

**Do not ask which option to take.** There is one procedure and it is written
above. A story here is a work order, not a request for a plan.

**Do not release the claim.** The remainder story IS the handoff.

**Never rename or reword a test name** — names are how `parity:test` matches — and
leave `scripts/test-compare/assertion-mismatch-mark.json` untouched; it is frozen
for the duration of this RFC.

## A converged assertion that fails is a story, not a detour

Converging a test's assertions regularly surfaces a real production bug: the
test now asserts what Rails asserts, and the port does not do it. **Do not fix
the production code in this PR.**

1. **Land the converged body** — same count, same kinds, same expected values as
   Rails. Do not soften an assertion to make it pass, and do not delete it.
2. **Park the test** as `it.skip`, converged body intact, with one `BLOCKED:`
   line pointing at the story you filed (one line only —
   `blazetrails/no-freeform-comments` allowlists `BLOCKED:` and nothing else
   here). Park inside the existing adapter-gate wrapper, never as a bare
   `it.skip`, or `classifyGateMismatch` scores it `should-gate` and the
   `Test comparison` CI step fails hard.
3. **File the story in RFC `0155-assertion-surfaced-port-bugs`**
   (`pnpm tasks new 0155-assertion-surfaced-port-bugs <slug> --body-file <path>`),
   carrying the parked test's name and file, the Rails `file:line`, what Rails
   asserts, what the port does instead, and plainly how far you got.
4. **Move on to the next file.**

**Always exit through a PR.**

## Context

Measured 2026-09-19 with `pnpm parity:test -- --assertions` on `origin/main`.
The PostgreSQL adapter/datatype test tail — the whole `adapters/postgresql/`
directory except the files already owned by `assertions-tail-adapters-1-remainder`
(`bytea_test.rb`, `enum_test.rb`, `uuid_test.rb`) and
`assertions-tail-adapters-3a-remainder` (`quoting_test.rb`).

| Rails file                                                      | count | kind | value |   total |
| --------------------------------------------------------------- | ----: | ---: | ----: | ------: |
| `adapters/postgresql/datatype_test.rb`                          |    12 |    0 |     0 |      12 |
| `adapters/postgresql/connection_test.rb`                        |    12 |    0 |     0 |      12 |
| `adapters/postgresql/money_test.rb`                             |    11 |    0 |     0 |      11 |
| `adapters/postgresql/timestamp_test.rb`                         |    10 |    0 |     0 |      10 |
| `adapters/postgresql/hstore_test.rb`                            |     9 |    0 |     0 |       9 |
| `adapters/postgresql/array_test.rb`                             |     9 |    0 |     0 |       9 |
| `adapters/postgresql/schema_authorization_test.rb`              |     8 |    0 |     0 |       8 |
| `adapters/postgresql/rename_table_test.rb`                      |     8 |    0 |     0 |       8 |
| `adapters/postgresql/date_test.rb`                              |     8 |    0 |     0 |       8 |
| `adapters/postgresql/infinity_test.rb`                          |     7 |    0 |     0 |       7 |
| `adapters/postgresql/foreign_table_test.rb`                     |     7 |    0 |     0 |       7 |
| `adapters/postgresql/extension_migration_test.rb`               |     7 |    0 |     0 |       7 |
| `adapters/postgresql/transaction_test.rb`                       |     6 |    0 |     0 |       6 |
| `adapters/postgresql/serial_test.rb`                            |     6 |    0 |     0 |       6 |
| `adapters/postgresql/referential_integrity_test.rb`             |     6 |    0 |     0 |       6 |
| `adapters/postgresql/postgresql_adapter_prevent_writes_test.rb` |     6 |    0 |     0 |       6 |
| `adapters/postgresql/network_test.rb`                           |     6 |    0 |     0 |       6 |
| `adapters/postgresql/explain_test.rb`                           |     6 |    0 |     0 |       6 |
| `adapters/postgresql/deferred_constraints_test.rb`              |     6 |    0 |     0 |       6 |
| `adapters/postgresql/composite_test.rb`                         |     5 |    0 |     0 |       5 |
| `adapters/postgresql/transaction_nested_test.rb`                |     4 |    0 |     0 |       4 |
| `adapters/postgresql/full_text_test.rb`                         |     4 |    0 |     0 |       4 |
| `adapters/postgresql/bit_string_test.rb`                        |     4 |    0 |     0 |       4 |
| `adapters/postgresql/active_schema_test.rb`                     |     4 |    0 |     0 |       4 |
| `adapters/postgresql/citext_test.rb`                            |     3 |    0 |     0 |       3 |
| `adapters/postgresql/case_insensitive_test.rb`                  |     2 |    0 |     0 |       2 |
| `adapters/postgresql/statement_pool_test.rb`                    |     1 |    0 |     0 |       1 |
| **total**                                                       |   177 |    0 |     0 | **177** |

Expand per-test detail with:

```bash
pnpm parity:test -- --package activerecord --assertions --missing
```

The per-file totals above are the aggregate this refine measured; the
count/kind/value split is not broken out per file in the summary report — run
the `--missing` command to get it. 177 mismatches over 27 small files, no file
over 12, so this is one PR of many small edits rather than a file rewrite.

**Park inside the existing adapter-gate wrapper.** Every file here is
PostgreSQL-gated; replacing a gated test with a bare `it.skip` makes
`classifyGateMismatch` score it `should-gate` (`scripts/test-compare/gates.ts`)
and activerecord's gate-mismatch count is a hard zero with no baseline.

`adapters/postgresql/postgresql_adapter_test.rb`'s 2 remaining rows are NOT in
this story: they are 0155's `pg-ignores-warnings-test-match-assertion` and
`pg-translate-no-connection-raises-not-established`, both rehomed there
2026-09-19 because they need production work.

## Acceptance criteria

- [ ] Every Rails file above reports 0 assertion-count, 0 assertion-kind and
      0 assertion-value mismatches in
      `pnpm parity:test -- --package activerecord --assertions`, or the residue is
      carried by a filed remainder story and the parked rows by filed 0155
      stories.
- [ ] No test renamed; `parity:test`'s name-gate percent for `activerecord` does not drop.
- [ ] `scripts/test-compare/assertion-mismatch-mark.json` unchanged.
