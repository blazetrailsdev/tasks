---
title: "assertions-migration-constraint-files"
status: ready
updated: 2026-09-15
rfc: "0132-ar-closure-assertion-parity"
cluster: assertion-parity
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`assertions-migration-cluster` (RFC 0105) converged the seven Rails migration
test files named in its own table. Two more migration files carry an assertion
cluster that no story owns, and `port-migration-constraints-and-residue`
(PR #7253) grew each by one while that work was in flight:

Measured 2026-08-30 on `origin/main`:

| Rails test file (under `vendor/rails/activerecord/test/cases/`) | count | kind |
| --------------------------------------------------------------- | ----: | ---: |
| `migration/unique_constraint_test.rb`                           |     5 |    8 |
| `migration/exclusion_constraint_test.rb`                        |     4 |    5 |

Per-test breakdown via
`pnpm parity:test -- --package activerecord --assertions --missing`, grepping
for each file. trails counterparts:
`packages/activerecord/src/migration/unique-constraint.test.ts` and
`.../exclusion-constraint.test.ts`.

The shapes here are the ones already settled by PR #7261:

- `assert_empty` → `assertEmpty()` from `@blazetrails/activesupport` — vitest
  has no `empty` matcher, and `toEqual([])` scores as `equal`. Hits
  `remove unique constraint` and `remove unique constraint by column`.
- `assert_no_changes` → `assertNoChanges(expr, null, { from }, block)` — both
  `*constraints scoped to schemas` tests currently score `equal` where Rails is
  unmapped.
- The `deferrable` tests are assertion-COUNT gaps (rails 4-5 vs trails 2-3):
  read the Rails bodies and port the assertions they actually make, rather than
  collapsing several `assert_equal`s into one object comparison.

Both files are PostgreSQL-only (exclusion constraints and `USING INDEX` unique
constraints), so this needs a PG lane to verify — a SQLite-only run skips them
and proves nothing.

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

- Both files report 0 assertion-count, 0 assertion-kind and 0
  assertion-value mismatches in
  `pnpm parity:test -- --package activerecord --assertions`.
- The mark file is FROZEN for this RFC by
  `scripts/test-compare/assertion-mismatch-mark.freeze`: do NOT run
  `pnpm parity:test:assertions:reseed` and do NOT hand-edit
  `assertion-mismatch-mark.json`. The gate stays green while the mark carries
  slack; `tighten-assertion-mark-after-0132` lowers it once at the end.
- No test name changes; `pnpm parity:test` percent for activerecord does not drop.
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
