---
title: "param-name candidates pool across sibling classes and guessed files"
status: ready
updated: 2026-09-01
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0128's charter sends tooling false positives here. PR #7251 surfaced two
more, both from the same root: `tsParamsByFileNameInPkg` keys candidates by
(file, method name) only, so every declaration sharing a name in one TS file is
a candidate for one Ruby method — regardless of which CLASS it belongs to.
`param-name-check-pairs-nested-class-constructor-with-enclosing-initialize`
fixes the nested-`constructor` instance; these two are the sibling-class and
misplaced-file instances the same keying produces.

1. **Sibling classes, same method name.** `OutputBuffer#capture(*args)`
   (`vendor/rails/actionview/lib/action_view/buffers.rb:72`) yields its args to
   the block; `StreamingBuffer#capture` (`buffers.rb:126`) takes none and bare-
   `yield`s. trails spells them `capture(fn, ...args)` and `capture(fn)`
   (`packages/actionview/src/buffers.ts:95,202`). The one-parameter
   StreamingBuffer form is the only candidate that lines up with Ruby's
   one-slot `[*args]`, so `OutputBuffer#capture` is scored against a DIFFERENT
   CLASS's method and reports `args` renamed to `fn` — the ported block, not a
   renamed splat. Reported as `buffers.rb#capture @0 ruby args → ts fn`.

2. **The misplaced-file fallback pools the guessed file.** `object_renderer.rb`
   has no `renderer/object-renderer.ts` (trails declares `ObjectRenderer` inside
   `partial-renderer.ts:55`), so the comparer records
   `misplacedAt: renderer/abstract-renderer.ts` and takes that file's four
   `constructor` declarations as the candidates. `ObjectRenderer#initialize(
lookup_context, options)` (`object_renderer.rb:7`) is therefore scored
   against `RenderedTemplate#initialize(body, template)`
   (`abstract_renderer.rb:144`) and reports TWO renames that exist nowhere — the
   TS constructor already spells `lookupContext, options` correctly. Reported as
   `renderer/object_renderer.rb#initialize @0,@1`.

Instance 2 has a package-side convergence as well
([[actionview-renderer-files-and-inheritance-follow-rails]]); the tooling should
not report renames off a guessed file either way, since a wrong guess produces
rows that no rename can close.

## Converged shape

Scope parameter-name candidates by declaring CLASS, not just file — the same
narrowing the nested-`constructor` story needs, applied to non-constructor
members too. And when a Ruby file's TS counterpart was reached by the
`misplacedAt` guess rather than the expected path, do not emit parameter-name
rows for it at all: the pairing is a guess, so its rows are not evidence of
drift.

## Acceptance criteria

- `output/param-name-mismatches.json` contains neither the `buffers.rb#capture`
  row nor the two `renderer/object_renderer.rb#initialize` rows.
- No parameter renamed in `packages/**` to close them.
- actionview's mark in `scripts/api-compare/param-name-mark.json` is narrowed
  with `pnpm parity:api:params:tighten` (never rewritten upward).
- `pnpm parity:api` methods and arity figures unmoved; `pnpm parity:api:params`
  still OK.
