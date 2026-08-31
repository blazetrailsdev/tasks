---
title: "Delete the re-export shims left by the value-type moves and repoint the stale RFC 0089 citations"
status: done
updated: 2026-08-31
rfc: "0129-ruby-compat"
cluster: null
packages:
  ["ruby-compat", "activesupport", "activerecord", "activemodel", "actionpack", "date", "i18n"]
deps:
  [
    "move-regexp-escape-to-ruby-compat",
    "move-range-core-and-succ-to-ruby-compat",
    "move-rational-to-ruby-compat",
    "ruby-compat-symbol-conventions",
    "ruby-compat-comparable",
    "ruby-compat-hash-fetch-and-key-error",
    "ruby-compat-hash-merge-and-iteration",
    "ruby-compat-hash-default-proc-and-dig",
  ]
deps-rfc: []
est-loc: 180
priority: 20
pr: 7300
claim: "2026-08-31T15:43:38Z"
assignee: "ruby-spec-behavioural-enrollment"
blocked-by: null
closed-reason: null
---

## Context

The last story of the value-type moves. Each move story left a re-export shim at the old path
so its PR stayed a reviewable move and every existing import kept working; the
shims are the thing that let seven moves ship independently and be reverted
independently. This story removes them once every caller has been flipped.

Shims to delete (each created by its own move story — confirm against the merged
PRs, not this list):

- `packages/activesupport/src/core-ext/regexp.ts` (`regexpEscape`)
- `packages/activesupport/src/range-ext.ts` and
  `packages/activesupport/src/core-ext/string/succ.ts`
- `packages/activesupport/src/core-ext/key-error.ts`
- the `Rational` re-export from `packages/date`

**Public surface is the constraint.** `activesupport/src/index.ts` re-exports
several of these (`:2` `KeyError`, `:693` `Range`), and `@blazetrails/date`
exports `Rational`. Deleting a shim must not silently narrow a published
package's surface — either the index re-exports from `@blazetrails/ruby-compat`
instead, or the removal is a deliberate, stated surface change. Decide per
export and say which in the PR body.

**Stale citations.** `packages/activesupport/src/tempfile.ts` carries five
references to RFC 0089 — `:16`, `:32`, `:82-83` ("beside activesupport's other
unanchored Ruby primitives (`range-ext.ts`, `include.ts`,
`core-ext/string/succ.ts`) until RFC 0089 (`corelib-primitives`) reactivates and
re-homes them together"), and `:233`. Two of the three files it names will have
moved, so the sentence becomes false. Repoint all five at this RFC and correct
the file list. `Tempfile` itself is **deferred** and does not move here.

## Acceptance criteria

- Every value-type re-export shim deleted; no import in the tree resolves through
  one.
- Each affected package's public surface is either preserved (index re-exports
  from `@blazetrails/ruby-compat`) or deliberately changed with the change stated
  in the PR body — never narrowed by accident.
- `packages/activesupport/src/tempfile.ts`'s five RFC 0089 citations repointed at
  this RFC with the file list corrected; `Tempfile` itself unchanged.
- No `declare module` augmentation is left pointing at a deleted path (the Range
  move should already have retargeted `compare-range.ts:18`, `overlap.ts:64`,
  `conversions.ts:15` — verify).
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args`,
  `parity:api:calls:ruby-compat`, `parity:api:params`, `parity:api:extra` all
  green with no new rows.
- Every package suite green, all three AR lanes; `pnpm typecheck` clean with
  `tsc --build --force` (an incremental build skips projects).
- Verify module-load order with a plain-node import of the **built** `dist/**.js`
  entry modules, each in its own node process — a vitest run enters the funnel
  module first and masks a TDZ cycle, so a green suite proves nothing here.
