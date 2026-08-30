---
title: "actionview renderer files and inheritance follow Rails"
status: ready
updated: 2026-08-30
rfc: "0128-parameter-name-drift-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 170
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails splits the partial renderers across three files, each subclassing the one
before:

- `vendor/rails/actionview/lib/action_view/renderer/partial_renderer.rb:220` —
  `class PartialRenderer < AbstractRenderer`
- `vendor/rails/actionview/lib/action_view/renderer/object_renderer.rb:4` —
  `class ObjectRenderer < PartialRenderer`
- `vendor/rails/actionview/lib/action_view/renderer/collection_renderer.rb:33` —
  `class CollectionRenderer < PartialRenderer`

trails declares all three in `packages/actionview/src/renderer/partial-renderer.ts`
(`:32`, `:55`, `:123`) and has each extend `AbstractRenderer` directly, so both
the file layout and the inheritance chain diverge. Because `object_renderer.rb`
and `collection_renderer.rb` have no TS counterpart, `parity:api` reports them
as misplaced and guesses `renderer/abstract-renderer.ts`, which is what produces
the two unclosable parameter-name rows held in
[[param-drift-actionview-structural-residue]] and drives
[[param-name-candidates-pool-across-sibling-classes-and-guessed-files]].

The flattened inheritance is what forced the flattened files: `parsePartialPath`
and `findPartialTemplate` (`partial-renderer.ts:11,18`) are module-private
helpers all three classes need, and Rails hands them down by subclassing
(`PartialRenderer#find_partial` / `#partial_path`). Splitting the files without
fixing the chain would mean exporting a trails-invented helper across them —
extra measured surface, and the wrong shape.

## Converged shape

`ObjectRenderer extends PartialRenderer` in `renderer/object-renderer.ts`, and
`CollectionRenderer extends PartialRenderer` in `renderer/collection-renderer.ts`,
with the shared partial lookup reached by inheritance rather than a module
helper — matching Rails' own decomposition. `renderer.ts:5` and the two test
files import from the new paths.

## Acceptance criteria

- `renderer/object-renderer.ts` and `renderer/collection-renderer.ts` exist and
  hold only their own class; `parity:api` no longer reports
  `renderer/object_renderer.rb` or `renderer/collection_renderer.rb` as
  misplaced, and the actionview files figure rises.
- Both classes extend `PartialRenderer`, and the shared partial lookup is not
  exported from `partial-renderer.ts`.
- `pnpm parity:api:extra --package actionview` gains no novel name; no
  `@noRailsEquivalent` added.
- The two `renderer/object_renderer.rb#initialize` rows leave
  `output/param-name-mismatches.json`, and actionview's mark is narrowed with
  `pnpm parity:api:params:tighten`.
- No test renamed; `parity:api:calls` and `parity:api:calls:args` no new row.
