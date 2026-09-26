---
title: "Journey extra-surface residue: Node#each, MatchData#[], TransitionTable to_json, index re-exports"
status: in-progress
updated: 2026-09-26
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8132
claim: "2026-09-26T03:02:03Z"
assignee: "journey-extra-surface-residue"
blocked-by: null
closed-reason: null
---

## Context

`journey-parity-residue-and-mark-to-zero` swept Journey's test rows (all ten
`journey/**` test files now match, 0 wrong-describe, 0 missing), lowered the
actiondispatch assertion mark to `{ assertionCount: 357, kind: 513, value: 72 }`
and pinned `TransitionTable#[]=` → `set`. What it could not close inside its PR
is the Journey slice of `pnpm parity:api:extra --package actiondispatch`:

- `journey/nodes/node.ts:14` — `*[globalThis.Symbol.iterator]()` reads as a novel
  extra. Rails' `Nodes::Node` is `include Enumerable` with `def each(&block)`
  (`vendor/rails/actionpack/lib/action_dispatch/journey/nodes/node.rb:70,79`);
  port `each` at the Rails name and derive the iterator from it (or receipt the
  iterator protocol, which JS has and Ruby spells as `each`).
- `journey/path/pattern.ts:143` — `MatchData#at` is Rails' `def [](x)`
  (`journey/path/pattern.rb:141`). Pin `ActionDispatch::Journey::Path::Pattern::MatchData#[]`
  → `at` in `OPERATOR_SPELLING_BY_FQN` (`scripts/api-compare/operator-order-spelling.ts`),
  or rename to the table's usual `get`.
- `journey/gtg/transition-table.ts:26-29` — the declaration-merged
  `interface TransitionTable { toJSON: Included<...> }` surfaces the
  `ToJsonWithActiveSupportEncoder#to_json` include as a moved extra;
  `transition_table.rb:141` reads `to_json` off Object's AS include.
- `journey/index.ts:13-21` — `export * as Nodes/Visitors/GTG/Path` score as
  four moved names against a file with no Rails counterpart (Rails' `journey.rb`
  only requires the files).

Also left: `journey/router/utils.test.ts` "normalize path maintains string
encoding" is a PERMANENT-SKIP (`router/utils_test.rb:37-40` asserts
`Encoding::ASCII_8BIT` on a `.b` string; a JS string carries no encoding), and
`journey/route.rb` stays at 33/35 until `journey-verb-matchers-class-shape`
lands (`VerbMatchers::All` is an object literal, `route.rb:36-39`).

## Acceptance criteria

- `pnpm parity:api:extra --package actiondispatch` lists no `journey/` file.
- No `@noRailsEquivalent` receipt where a Rails name exists to converge onto.
- `pnpm parity:api:calls`, `:calls:args`, `:params`, `:extra:gate` stay green.
