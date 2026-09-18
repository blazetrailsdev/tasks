---
title: "assertions-migration-test-file"
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

`assertions-migration-cluster` (RFC 0105) burned the migration assertion cluster
down to 0 in six of its seven files. `migration_test.rb` is left: it alone
carries **46 assertion-count and 74 assertion-kind divergences** across ~90
tests, which does not fit inside one PR's LOC ceiling next to the other six.

Measured 2026-08-30 after PR for `assertions-migration-cluster`:

| Rails test file     | count | kind | value |
| ------------------- | ----: | ---: | ----: |
| `migration_test.rb` |    46 |   74 |     0 |

Expand per test with
`pnpm parity:test -- --package activerecord --assertions --missing` and grep for
`migration_test.rb ›`. trails counterpart:
`packages/activerecord/src/migration.test.ts`.

The recurring shapes, all settled by the sibling story's PR — copy them:

- `assert` / `assert_predicate` → `toBeTruthy()`, `assert_not` /
  `assert_not_predicate` → `toBeFalsy()` (never `toBe(true)`/`toBe(false)`,
  which score as `equal`).
- `assert_empty` → `assertEmpty()` from `@blazetrails/activesupport` (vitest has
  no `empty` matcher).
- `assert_raises` → `assertRaises([Klass], { match }, () => …)`; a
  `.catch(e => e)` + `toBeInstanceOf` pair scores `instanceOf`, not `raises`.
- `assert_nothing_raised` → `assertNothingRaised(() => …)`.
- `assert_no_changes` → `assertNoChanges(expr, null, { from }, block)`.
- `assert_queries_count`, `assert_column` / `assert_no_column`,
  `assert_difference` are unmapped on the Rails side — the port must call a
  correspondingly-named `assert*` helper so BOTH sides are unmapped rather than
  scoring `equal`/`includes`.
- An adapter branch (`if current_adapter?(…)`) counts BOTH arms on the Rails
  side. `vitest/no-conditional-in-test` is `error` for
  `packages/activerecord/**/*.test.ts`, so put the branch in a same-file
  `function` declaration whose name does NOT start with `assert`/`expect`/`must`
  — a non-assertion helper folds its assertions into the caller's count, while
  an `assert*`-named one is scored as a single unmapped assertion instead.

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

3. **File the story** in **RFC `0155-assertion-surfaced-port-bugs`**, the
   bucket this RFC's overflow goes to:

   ```bash
   pnpm tasks new 0155-assertion-surfaced-port-bugs <slug> --body-file <path>
   ```

   Not this RFC, which owns the assertion axis only. (If an active RFC already
   owns that behaviour, file it there instead and say so — 0155 is the default,
   not a monopoly.) Capture the trails and Rails `file:line` you already have in
   front of you; a title-only stub forces an expensive re-derivation later.

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

- `migration_test.rb` reports 0 assertion-count, 0 assertion-kind and 0
  assertion-value mismatches in
  `pnpm parity:test -- --package activerecord --assertions`.
- The mark file is FROZEN for this RFC by
  `scripts/test-compare/assertion-mismatch-mark.freeze`: do NOT run
  `pnpm parity:test:assertions:reseed` and do NOT hand-edit
  `assertion-mismatch-mark.json`. The gate stays green while the mark carries
  slack; `tighten-assertion-mark-after-0132` lowers it once at the end.
- No test name changes; `pnpm parity:test` percent for activerecord does not drop.
- No new rows in `scripts/parity/unported-files/`.
- A converged assertion that fails because of a production bug is parked
  `it.skip` with the structured annotation and a filed story — see "A
  converged assertion that fails is a story, not a detour" above — not fixed
  in this PR.
- **Or the split is filed.** A file listed above that this PR does not take to
  0 is named, with its residue re-measured, in a remainder story filed under
  this RFC — see "Finish the story or split it" above. The converged subset plus
  a filed remainder satisfies this story; converged commits with no PR do not.

## LOC limit

**The per-PR LOC limit is LIFTED for RFC 0132.** Stories here may ship as large
a PR as the work honestly needs; do not split a file's burndown, restructure a
test, or leave a remainder unconverged merely to fit a line budget. Every other
constraint (no test renames, mark file only-shrink, no name-gate regression)
still applies.
