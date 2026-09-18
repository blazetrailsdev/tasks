---
title: "has_many association assertion parity — remainder after trails#7864"
status: draft
updated: 2026-09-18
rfc: "0132-ar-closure-assertion-parity"
cluster: assertion-parity
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 420
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Remainder of `assertions-has-many-associations` after trails#7864 converged ~35 of 311 tests in
`packages/activerecord/src/associations/has-many-associations.test.ts` against
`vendor/rails/activerecord/test/cases/associations/has_many_associations_test.rb`.
After #7864: 97 assertion-count and 167 assertion-kind mismatches remain
(`pnpm parity:test -- --package activerecord --assertions --missing | grep has_many_associations_test`).
Remaining tests still use placeholder Author/Post classes instead of the Rails scenario
(counter-cache cluster ~test_has_many_without_counter_cache_option onward, clearing/deleting/destroying,
dependence/restrict, get/set ids, replace, extend option, in-memory replacement, composite key).
Fixture-dependent tests need their own nested `describe` with `fixtures([...])`, since a non-empty
`fixtures()` on the shared describe trips blazetrails/test-fixture-parity for every test.
Known blocker: `association proxy transaction method starts transaction in association class`
(has_many_associations_test.rb:2506) — vi.spyOn(Comment, "transaction") records 0 calls inside this file only.

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

- `has_many_associations_test.rb` reports 0 assertion-count/kind/value
  mismatches, **or** this PR converges as much of it as one session honestly
  holds and files its own remainder, with the residue re-measured — the converged
  subset plus a filed remainder satisfies this story, converged commits with no
  PR do not. Expect the latter: the residue after trails#7864 is **264
  mismatches (97 count + 167 kind) across the ~276 tests that file still has
  unconverged**, which is over the ~250 split threshold in the RFC's "Finish the
  story or split it". Split at scoping, before converging.
- `est-loc: 420` sizes the whole residue, not one PR: 264 mismatches at the
  ~1.6 LOC-per-mismatch `assertions-finder-test` actually cost (238 mismatches,
  380 LOC). Expect it to arrive as two PRs, not one.
- No test renames; mark file untouched.
