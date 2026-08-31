---
title: "param-drift-actionview-structural-residue"
status: in-progress
updated: 2026-08-31
rfc: "0128-parameter-name-drift-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 190
priority: 7
pr: 7315
claim: "2026-08-31T21:03:42Z"
assignee: "param-drift-actionview-structural-residue"
blocked-by: null
closed-reason: null
---

## Context

`param-drift-actionview` took actionview from 14 param-name rows to 3 and
enrolled it in `pnpm parity:api:params` at a mark of 3. All three survivors are
structural port divergences rather than renames, so each needs its own
convergence.

### 1. `renderer/object_renderer.rb#initialize` — 2 rows, a misplaced file

Rails puts `ObjectRenderer` in its own file
(`vendor/rails/actionview/lib/action_view/renderer/object_renderer.rb:4-10`,
`def initialize(lookup_context, options)`); trails declares it inside
`packages/actionview/src/renderer/partial-renderer.ts:55-58`. With no
`renderer/object-renderer.ts`, `parity:api` guesses `misplacedAt:
renderer/abstract-renderer.ts` and pools that file's four `constructor`
declarations as the candidates — so `initialize(lookup_context, options)` is
scored against `RenderedTemplate#initialize(body, template)`
(`abstract_renderer.rb:144`) and reports two renames that exist nowhere. The TS
constructor already spells `lookupContext, options` correctly.

The fix is the file split Rails already has: move `ObjectRenderer` to
`renderer/object-renderer.ts` (and `CollectionRenderer` to
`renderer/collection-renderer.ts`, which has the same misplacement). The one
snag is `findPartialTemplate` / `parsePartialPath`
(`partial-renderer.ts:11-24`), module-private helpers all three classes use;
Rails gets them by inheritance (`class ObjectRenderer < PartialRenderer`,
`class CollectionRenderer < PartialRenderer`) while trails has all three extend
`AbstractRenderer` directly. Converging the inheritance is the shape that avoids
exporting a trails-invented helper.

### 2. `buffers.rb#capture` — 1 row, Ruby's `*args` dropped

`OutputBuffer#capture(*args)` (`buffers.rb:72`) yields its args to the block;
`StreamingBuffer#capture` (`buffers.rb:126`) takes none and bare-`yield`s.
trails spells them `capture(fn, ...args)` and `capture(fn)`
(`packages/actionview/src/buffers.ts:95,202`). The check pools by file+name, so
`OutputBuffer#capture(*args)` is scored against StreamingBuffer's one-parameter
form and reports `args` renamed to `fn` — the ported block, not a renamed splat.
Same class as `param-drift-positional-misalignment-is-a-dropped-parameter`.

## Acceptance criteria

- All three positions carry the Rails identifier, verified against
  `vendor/rails` at the cited `file:line`, or the one that genuinely cannot is a
  `pnpm tasks block` naming the language shortcoming.
- actionview's mark in `scripts/api-compare/param-name-mark.json` is narrowed
  with `pnpm parity:api:params:tighten` (never rewritten upward), and
  `pnpm parity:api:params` reports actionview 0/0.
- No test renamed; `pnpm parity:api` methods/arity unmoved, `parity:api:calls`
  and `parity:api:calls:args` no new row.
