---
title: "assertions-activesupport-multibyte-chars"
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

## How to work this story

Read this before the measurements below. It is the whole operating procedure,
and it does not vary by story.

1. **Measure, then take a slice.** Run
   `pnpm parity:test -- --package <pkg> --assertions --missing` and work the
   tests in the order it lists them. Converge until you have cleared **~100
   mismatches**, then stop taking new ones.
2. **Re-measure, file the remainder, open the PR.** The remainder story carries
   the residue you just measured plus everything you learned — the canonical
   models you identified, the fixture wiring, the blockers. Then the PR goes up.
3. **That is the end of the story either way.** If the file reached 0, the PR
   closes it. If it did not, the PR plus the filed remainder closes it. A story
   in this RFC is never handed back unfinished.

**Do not ask which option to take.** There is one option and it is written
above. A story here is a work order, not a request for a plan, and "this is
bigger than one turn" is the expected case for every file in this RFC, not a
discovery that needs a decision from anyone.

**Do not release the claim.** The remainder story IS the handoff — it is how the
next agent gets your work plus your context. Releasing instead throws the
context away and leaves the next agent to re-derive it.

**~100 is measured, not a guess.** trails#7864 cleared 72 mismatches in a long
session on `has_many_associations_test.rb`; trails#7862 cleared 238 on
`finder_test.rb` in an exceptional one. Clear more if the file is going well.
Clear fewer and file earlier if it is not — a small converged PR with a good
remainder story beats a large one that never opens.

## Context

Split from `assertions-activesupport-string-ext-multibyte-safe-buffer` (RFC 0132).
That story converged `core_ext/string_ext_test.rb` and `safe_buffer_test.rb`;
`multibyte_chars_test.rb` (110 mismatch lines) and the three `CoreExtStringMultibyteTest`
tests in `string_ext_test.rb` (`core ext adds mb chars`, `string should recognize utf8
strings`, `mb chars returns instance of proxy class`) could not converge honestly:

- `ActiveSupport::Multibyte::Chars` (`vendor/rails/activesupport/lib/active_support/multibyte/chars.rb`)
  and `String#mb_chars` / `String#is_utf8?` (`core_ext/string/multibyte.rb`) have no port.
  `scripts/parity/conventions.ts` SKIP_GROUPS carries the `multibyte/chars.rb` group
  ("a JS string is a UTF-16 code unit sequence ... no wrapper to hold") and the
  `multibyte.rb` `proxy_class` group.
- `packages/activesupport/src/multibyte-chars.test.ts` asserts test-local helper
  functions (`mbSlice`, `mbRjust`, ...) rather than product code, so matching assertion
  counts there would be fake parity.
- Chars forwards through `method_missing` to Ruby `String` methods (`rjust`, `center`,
  `insert` raising `IndexError`, `index`/`rindex` with character offsets, `[]=` with
  Range/Regexp, `slice!`, `tidy_bytes`), none of which exist on a JS string.
- `string to datetime` / `truncates bytes preserves encoding` in `string_ext_test.rb`
  also remain: `toDatetime` (`core-ext/string/conversions.ts`) returns a Temporal value
  rather than `DateTime`, and a JS string carries no `Encoding`.

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
2. **Park the test**, converged body intact, as `it.skip` carrying one
   `BLOCKED:` line pointing at the story you filed:

   ```ts
   it.skip("rails test name, unchanged", async () => {
     // BLOCKED: <story-slug>
     // ...converged body, mirroring the Rails assertions...
   });
   ```

   **The comment is a pointer, nothing more.** It exists so a reader of the test
   can find the story; it is not where the finding is recorded. Keep it to one
   line — `blazetrails/no-freeform-comments` allowlists `BLOCKED:` and
   `PERMANENT-SKIP:` and nothing else in this neighbourhood
   (`eslint/no-freeform-comments.mjs:84`), so the `ROOT-CAUSE:` and `SCOPE:`
   lines in `scripts/test-compare/normalize-skips.ts`'s header are stripped by
   `eslint --fix` and red the pre-commit hook. That header predates the rule; the
   rule wins.

   **Put the effort in the story instead**, which is the artifact that is
   reviewed, searched and scheduled. It carries the parked test's name and file,
   the Rails `file:line` and what Rails asserts there, what the port does
   instead, and — plainly — how far you actually got. "Isolated to this file;
   cause not established" is a good story; a confident root cause you did not
   verify is a worse one. Not having investigated is a reason to park and file,
   never a reason to guess.

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

- Decide (and record in `scripts/parity/conventions.ts`) whether `Multibyte::Chars` is
  ported; if ported, remove the two SKIP groups and port `chars.rb`, `unicode.rb`,
  `String#mb_chars` and `String#is_utf8?` at their Rails paths.
- `multibyte_chars_test.rb` reports 0 assertion count / kind / value mismatches with the
  TS tests exercising product code, not test-local helpers.
- `string_ext_test.rb`'s `string to datetime` asserts `DateTime.civil(...)`, `offset` and
  `start` against a `DateTime` return.
- The mark file is FROZEN for this RFC by
  `scripts/test-compare/assertion-mismatch-mark.freeze`: do NOT run
  `pnpm parity:test:assertions:reseed` and do NOT hand-edit
  `assertion-mismatch-mark.json`. The gate stays green while the mark carries
  slack; `tighten-assertion-mark-after-0132` lowers it once at the end.
- A converged assertion that fails because of a production bug is parked
  `it.skip` with the structured annotation and a filed story — see "A
  converged assertion that fails is a story, not a detour" above — not fixed
  in this PR.
- **Or the split is filed.** A file listed above that this PR does not take to
  0 is named, with its residue re-measured, in a remainder story filed under
  this RFC — see "Finish the story or split it" above. The converged subset plus
  a filed remainder satisfies this story; converged commits with no PR do not.
