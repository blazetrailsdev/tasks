---
rfc: "0139-actiondispatch-journey-parity"
title: "ActionDispatch Journey to 100% on every parity axis"
status: draft
created: 2026-09-07
updated: 2026-09-07
owner: "@deanmarano"
packages:
  - "actionpack"
clusters: []
priority: 2
---

# RFC 0139 — ActionDispatch Journey to 100% on every parity axis

## Summary

Take `ActionDispatch::Journey` — the routing recognition/generation engine at
`actionpack/lib/action_dispatch/journey/**` — to 100% on every axis the parity
scripts measure: methods, arity, parameter names, call sets, call arguments,
extra surface, tests, and assertions.

Journey is the first actionpack subsystem to be driven to zero because it is
the one where the remaining distance is almost entirely **bookkeeping rather
than porting**. The implementation is 222/226 methods with zero extra surface
and zero arity/param/option/literal drift; the test dimension reads 1/126 not
because the tests are unported but because 119 of the 126 are present in the
tree under the wrong name or in the wrong file.

## Motivation

### Measured state, 2026-09-07

All figures from `pnpm parity:api --package actiondispatch` and
`pnpm parity:test --package actiondispatch` against a fresh `pnpm build`.

| Axis                        | Journey today    | Target    |
| --------------------------- | ---------------- | --------- |
| Methods                     | 222/226 (98.2%)  | 226/226   |
| Arity                       | 0 mismatches     | 0         |
| Parameter names             | 0 mismatches     | 0         |
| Option keys / literals      | 0 / 0            | 0 / 0     |
| Extra surface               | 0 novel, 0 moved | 0 / 0     |
| Call-set baseline rows      | 8                | 0         |
| Call-argument baseline rows | 1                | 0         |
| Tests                       | **1/126 (0.8%)** | 126/126   |
| Assertions                  | unmeasured       | 0 / 0 / 0 |

Four missing methods, across three files:

| Ruby                      | Missing                                          |
| ------------------------- | ------------------------------------------------ |
| `journey/router/utils.rb` | `UriEncoder#escape`, `UriEncoder#percent_encode` |
| `journey/route.rb`        | `VerbMatchers::Unknown#call`                     |
| `journey/scanner.rb`      | `Scanner#peek_byte`                              |

Nine call baseline rows, across six shards under
`scripts/api-compare/call-mismatches-exclude/actiondispatch/journey/`:
`gtg/builder.json` (1 calls), `gtg/transition-table.json` (1 calls, 1 args),
`nodes/node.json` (3 calls), `path/pattern.json` (1 calls), `route.json`
(1 calls), `visitors.json` (1 calls).

### The test dimension is a naming defect, not a porting gap

Rails' Journey tests are `def test_*`-style, not `test "prose"`-style.
`scripts/test-compare/extract-ruby-tests.rb:514` derives the comparable
description as `name.sub(/^test_/, "").tr("_", " ")`, so
`def test_path_escape` must be ported as `it("path escape")`. trails spelled
these tests `it("test_path_escape")` — the raw Ruby method name — which credits
nothing and shows as simultaneous `missing` and `extra` on the same file.

Triage of the 125-test gap, measured file by file:

| Root cause                                                     | Tests | Fix                         |
| -------------------------------------------------------------- | ----- | --------------------------- |
| Name spelled `test_foo_bar` instead of `foo bar`               | 83    | Mechanical re-spelling      |
| Located in `dispatch/routing.test.ts`, not the convention file | 36    | Move to the convention file |
| Genuinely absent                                               | 6     | Port from the Ruby          |

A further **54 trails-only tests** sit inside the convention files. They are not
deleted; they move to `.trails.test.ts` siblings, which are outside the
convention path and therefore outside the compared population
(`compare.ts:765` keys the TS test set on the convention path alone).

Per Rails test file:

| Ruby test file                             | Rails | Re-spell | Move | Port | trails-only |
| ------------------------------------------ | ----- | -------- | ---- | ---- | ----------- |
| `journey/router_test.rb`                   | 35    | 0        | 25   | 10   | 14          |
| `journey/route/definition/parser_test.rb`  | 21    | 21       | 0    | 0    | 0           |
| `journey/path/pattern_test.rb`             | 20    | 18       | 0    | 2    | 18          |
| `journey/route_test.rb`                    | 11    | 11       | 11   | 0    | 6           |
| `journey/router/utils_test.rb`             | 9     | 8        | 0    | 1    | 6           |
| `journey/nodes/ast_test.rb`                | 9     | 9        | 0    | 0    | 0           |
| `journey/gtg/transition_table_test.rb`     | 8     | 7        | 0    | 1    | 4           |
| `journey/gtg/builder_test.rb`              | 6     | 6        | 0    | 0    | 0           |
| `journey/routes_test.rb`                   | 6     | 3        | 0    | 2    | 4           |
| `journey/route/definition/scanner_test.rb` | 1     | 0        | 0    | 1    | 27          |

`route_test.rb`'s 11 appear in both the re-spell and move columns: the
convention file `journey/route.test.ts` holds them under the `test_*` spelling
AND `dispatch/routing.test.ts` holds a second copy that the comparer reports as
misplaced. Re-spelling the convention copy credits them; the duplicate in
`dispatch/routing.test.ts` is then deleted, not moved.

## Design

### Re-spelling these names is convergence, not a rename

CLAUDE.md says test names are never renamed or reworded, because they are what
`parity:test` matches on. That rule is not in tension with this RFC — it is the
reason for it. `it("test_path_escape")` is not the Rails name; the Rails name,
as the extractor derives it, is `"path escape"`. The current spelling is the
drift and re-spelling is the convergence. No test's _meaning_ changes, no test
is reworded, and nothing is renamed to make a number move.

### The assertion mark will rise before it falls, once

`scripts/test-compare/assertion-mismatch-mark.json` is per-package and
only-shrink (`assertion-ratchet.ts`, RFC 0025). Journey's assertion debt is
currently **invisible**: assertions are only compared for a _matched_ pair, and
Journey has one matched test. Matching 125 tests therefore surfaces their
assertion mismatches for the first time and raises actiondispatch's counters —
which reds `pnpm parity:test:assertions` even though nothing regressed.

This is the same situation RFC 0122 hit on arel, where mapping `must_be_like`
made 326 assertions value-comparable for the first time and the `value` mark was
raised 17 → 79 as a one-time honest correction, then burnt down. Journey follows
that precedent:

1. The first story lands the re-spelling and file moves, measures the assertion
   mismatches this newly reveals, and raises actiondispatch's mark by exactly
   that measured delta — with the before/after in the PR body.
2. Every later story burns the revealed mismatches down.
3. The closing story tightens actiondispatch's mark back to at or below its
   pre-RFC value of `{ assertionCount: 360, kind: 515, value: 74 }`.

The correction is bounded and auditable: it is the only mark increase this RFC
permits, no other package's counters may move, and the RFC does not close until
the mark is back below where it started.

### Story shape

One story per Rails test file, because that is the unit the comparer reports and
the unit a PR can independently verify. Three non-test stories carry the API
axes. Ordering puts the mark correction first so no later story inherits a red
ratchet it did not cause.

## Non-goals

- **`dispatch/routing_test.rb`'s own 158 skipped tests.** Journey stories touch
  `dispatch/routing.test.ts` only to remove the 36 tests that belong under
  `journey/`. The routing suite's own debt belongs to the actiondispatch Routing
  subsystem, which is a separate RFC.
- **`routing/mapper.rb` and `routing/route_set.rb`.** They are Journey's largest
  consumers and hold actiondispatch's largest method gap (79 methods), but they
  are `routing/`, not `journey/`.
- **Raising any gate's coverage to include actionpack.** actionpack is not in
  `GATED_PACKAGES` for the extra-surface ratchet. Journey reaching 0 novel / 0
  moved does not enrol the package; that is RFC 0120's decision to make.

## Alternatives considered

- **One sweeping "fix the Journey test names" PR.** 83 re-spellings plus 36
  moves plus 54 extractions is well past the LOC ceiling, and it would land the
  entire assertion-mark correction in a single unreviewable diff.
- **Deleting the 54 trails-only tests** to clear the extra column. They are real
  coverage — non-BMP escaping, repeated-slash collapsing — that Rails happens
  not to test. They move to siblings; nothing is deleted to make a number move.
- **Leaving the mark alone and burning assertions down first.** Not possible in
  that order: the assertions cannot be measured until the tests match, and the
  tests cannot match without the re-spelling that raises the mark.

## Rollout

1. Re-spelling + mark correction — `journey-test-names-to-rails-def-test-form`,
   `journey-assertion-mark-one-time-correction`
2. Per-file test parity — the eight `journey-*-test-parity` stories
3. API axes — `journey-missing-api-methods`,
   `journey-call-parity-baselines-to-zero`
4. Close — `journey-parity-residue-and-mark-to-zero`

## Verification

- `pnpm parity:api --package actiondispatch` reports every `journey/*.rb` row at
  100%, with 0 arity, 0 param-name, 0 option-key and 0 literal mismatches.
- `pnpm parity:api:extra --package actiondispatch` lists no `journey/` file.
- `scripts/api-compare/call-mismatches-exclude/actiondispatch/journey/` is
  empty, and `pnpm parity:api:calls` and `pnpm parity:api:calls:args` are green.
- `pnpm parity:test --package actiondispatch` reports 126/126 for the ten
  `journey/**` rows, 0 misplaced, 0 wrong-describe, 0 extra.
- `pnpm parity:test:assertions` is green with actiondispatch's mark at or below
  `{ assertionCount: 360, kind: 515, value: 74 }`.
- actiondispatch's package test parity rises from 827/1628 (50.8%) to roughly
  952/1628 (58.5%) on the printed figure.

## Open questions

1. **Does `journey/route/definition/scanner_test.rb`'s single Rails test come
   from the `CASES` table?** It does — the Ruby builds one test over a constant
   table of 27 input/token pairs, and trails ported it as 27 separate `it`s.
   Resolved in `journey-scanner-test-parity`: the port becomes one test
   iterating the same table, matching Rails' structure.

## Changelog

- 2026-09-07: initial RFC
