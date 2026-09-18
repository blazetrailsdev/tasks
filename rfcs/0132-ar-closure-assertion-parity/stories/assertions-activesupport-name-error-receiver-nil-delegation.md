---
title: "assertions-activesupport-name-error-receiver-nil-delegation"
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

Remainder of `assertions-activesupport-module-class-remainder` (RFC 0132) that needs
implementation work rather than test convergence:

- `core_ext/name_error_test.rb` asserts `exc.receiver` in both tests
  (`vendor/rails/activesupport/test/core_ext/name_error_test.rb:13,21`). Ruby core
  `NameError#receiver` has no counterpart on `packages/ruby-compat/src/name-error.ts`,
  and `constantize` (`packages/activesupport/src/inflector.ts`) does not record the
  receiver it resolved against.
- `core_ext/module_test.rb` `delegation to method that exists on nil` (and `... when
allowing nil`) expect `nil.to_f == 0.0` (`module_test.rb:340-348`): Rails'
  `Delegation.generate` (`active_support/delegation.rb:131-147`) calls the method on a
  nil target when `nil.respond_to?(method)`. `packages/activesupport/src/delegation.ts`
  raises `DelegationError` / returns `undefined` because there is no NilClass method
  table in ruby-compat.
- Permanent (not in scope): `delegation line number` / `delegate line with nil`
  (`source_location`), the `private delegate*` `assert_not_respond_to` arms (CLAUDE.md
  § "Method visibility is not a runtime fact in JS"), and the `-1` arities in
  `delegation arity to self class`.

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

- `NameError#receiver` ported onto ruby-compat's `NameError` and set by `constantize`;
  `name_error_test.rb` reports 0 mismatches.
- Delegation to a nil target honours `nil.respond_to?(method)` for the NilClass methods
  Rails' tests reach (`to_f`), and the two `module_test.rb` tests assert `0.0`.
- The mark file is FROZEN for this RFC by
  `scripts/test-compare/assertion-mismatch-mark.freeze`: do NOT run
  `pnpm parity:test:assertions:reseed` and do NOT hand-edit
  `assertion-mismatch-mark.json`. The gate stays green while the mark carries
  slack; `tighten-assertion-mark-after-0132` lowers it once at the end.
- A converged assertion that fails because of a production bug is parked
  `it.skip` with the structured annotation and a filed story — see "A
  converged assertion that fails is a story, not a detour" above — not fixed
  in this PR.
