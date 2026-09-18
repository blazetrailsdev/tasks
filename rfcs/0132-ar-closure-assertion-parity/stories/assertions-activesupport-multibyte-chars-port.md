---
title: "assertions-activesupport-multibyte-chars-port"
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

These are the rows left after
`assertions-activesupport-string-ext-multibyte-safe-buffer`. Nothing from that
story converged: every remaining row needs `ActiveSupport::Multibyte::Chars`
(`vendor/rails/activesupport/lib/active_support/multibyte/chars.rb`) and
`String#mb_chars`.

- `multibyte_chars_test.rb` (110 rows).
- `core_ext/string_ext_test.rb` (8 rows): `core ext adds mb chars`,
  `mb chars returns instance of proxy class`,
  `string should recognize utf8 strings`,
  `truncates bytes preserves encoding` and `string to datetime`.
- `safe_buffer_test.rb` `Should not fail if the returned object is not a string`.

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
2. **Park the test**, converged body intact, as `it.skip` carrying **one
   `BLOCKED:` line** that names the story you filed:

   ```ts
   it.skip("rails test name, unchanged", async () => {
     // BLOCKED: <category> — <what the port does instead> (<story-slug>)
     // ...converged body, mirroring the Rails assertions...
   });
   ```

   **One line, and it must be the `BLOCKED:` one.** `blazetrails/no-freeform-comments`
   allowlists `BLOCKED:` and `PERMANENT-SKIP:` and nothing else in this
   neighbourhood (`eslint/no-freeform-comments.mjs:84`), so the `ROOT-CAUSE:` and
   `SCOPE:` lines in `scripts/test-compare/normalize-skips.ts`'s header are
   stripped by `eslint --fix` and red the pre-commit hook. That header predates
   the rule; the rule wins. Everything those two lines would have said belongs in
   the story body, where it is reviewable and maintained — and **do not write a
   root cause you have not established**. "I haven't investigated it" is a reason
   to park and file, not a reason to guess in a comment.

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

- `Multibyte::Chars` is ported at its convention path.
- The three files report 0 count/kind/value mismatches.
- A converged assertion that fails because of a production bug is parked
  `it.skip` with the structured annotation and a filed story — see "A
  converged assertion that fails is a story, not a detour" above — not fixed
  in this PR.
- **Or the split is filed.** A file listed above that this PR does not take to
  0 is named, with its residue re-measured, in a remainder story filed under
  this RFC — see "Finish the story or split it" above. The converged subset plus
  a filed remainder satisfies this story; converged commits with no PR do not.
