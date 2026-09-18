---
title: "assertions-activesupport-module-test-delegation"
status: draft
updated: 2026-09-17
rfc: "0132-ar-closure-assertion-parity"
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

These are the rows left after `assertions-activesupport-module-class-remainder`.
Only `core_ext/module_test.rb` (16 rows) still reports mismatches.

- `private delegate`, `private delegate prefixed`,
  `private delegate with private option`,
  `some public some private delegate with private option`, and
  `private delegate prefixed with private option` (`module_test.rb:500-589`)
  assert `assert_not_respond_to` and `respond_to?(m, true)`. CLAUDE.md
  § "Method visibility is not a runtime fact in JS" says this cannot be
  observed in JS, so decide per test whether the assertion ports, for example
  through `Module#delegate`'s `private:` bookkeeping.
- `delegation arity to self class` (`module_test.rb:650`) asserts
  `instance_method(...).arity` for eleven delegators.
- `delegation line number` / `delegate line with nil` use `source_location`.
- `delegation to method that exists on nil` (with and without `allow_nil`)
  expects `0.0` from `nil.to_f`.

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

- `core_ext/module_test.rb` reports 0 count/kind/value mismatches, or each
  residual row cites the CLAUDE.md section that rules out porting it.
- A converged assertion that fails because of a production bug is parked
  `it.skip` with the structured annotation and a filed story — see "A
  converged assertion that fails is a story, not a detour" above — not fixed
  in this PR.
