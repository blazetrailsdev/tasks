---
title: "Derive applyTokenRenames' pattern from TOKEN_RENAMES so entries can't be dead code"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 6143
claim: "2026-08-05T20:53:11Z"
assignee: "pg-schema-statements-abstract-signature-divergences"
blocked-by: null
closed-reason: null
---

## Context

`TOKEN_RENAMES` (`scripts/api-compare/conventions.ts:20-29`) is a lookup table of
Ruby→TS token renames, but the substitution that consumes it hard-codes its own
alternation:

```ts
const TOKEN_RENAMES: Record<string, string> = {
  erb: "tse",
  rb: "js",
  ERB: "TSE",
  Erb: "Tse",
};

function applyTokenRenames(snake: string): string {
  return snake.replace(
    /(^|_)(erb|ERB|Erb|rb)(?=_|$)/g, // <-- second source of truth
    (_m, pre, tok: string) => pre + TOKEN_RENAMES[tok],
  );
}
```

The table and the regex are two sources of truth for one rule, and they silently
drifted. #6017 added the `rb: "js"` entry (with a justifying comment) but did not
widen the regex, so the entry was **dead code** for the whole time it sat on
`main`: `I18n::Backend::Base#load_rb` (`vendor/i18n/lib/i18n/backend/base.rb:254`)
kept resolving to `loadRb` and reporting MISS against the ported `loadJs`, while
`docs/ruby-ts-conventions.md` — generated from that same file and CI-verified —
published a Token renames table asserting `rb → js` was in effect.

Nothing caught it. The generated doc reads from the table, so the doc was
_correct about intent and wrong about behavior_, and the parity:api totals were
the only witness. #6043 fixed the one instance by widening the alternation, but
left the drift class open: the next entry added to `TOKEN_RENAMES` without a
matching regex edit fails exactly the same way, and the generated doc will again
advertise it as live.

## Acceptance criteria

- `applyTokenRenames` derives its pattern from `TOKEN_RENAMES` rather than
  restating it — build the alternation from `Object.keys(TOKEN_RENAMES)`,
  **longest-first** so a longer token wins over a shorter one that suffixes it
  (`erb` must still beat `rb`; today that is guaranteed only by hand-ordering the
  literal). Keep the existing `(^|_)` / `(?=_|$)` boundaries so standalone
  snake-segments alone substitute — `verb`, `verbatim`, `superb`, `http_verb`
  must stay untouched, as `scripts/api-compare/conventions.test.ts` already
  asserts.
- Escape keys when interpolating, so a future entry containing a regex
  metacharacter cannot corrupt the pattern.
- A test asserts **every** `TOKEN_RENAMES` key is actually reachable — iterate
  the table and assert `snakeToCamel(key)` yields the mapped value (and
  `snakeToCamel("load_" + key)` yields the camelized mapping). This is the guard
  that would have caught the `rb` drift; it must fail if an entry is added to the
  table and the substitution does not honor it.
- `pnpm parity:api` totals are unchanged for every package by this refactor —
  it is behavior-preserving today. Diff the full per-package totals table before
  and after with a fresh `pnpm build` on both sides; `rb` is currently the only
  standalone-`rb` name in the vendored corpus and `erb` covers 8 names, so any
  movement means the ordering or boundary handling regressed.
- `pnpm parity:api:conventions` regenerates `docs/ruby-ts-conventions.md` with no diff.

## Out of scope

The parallel token substitution in `rubyFileToTs`
(`scripts/api-compare/conventions.ts:128,133`), which hard-codes `/\berb\b/g` for
file paths and is a separate third spelling of the same idea. Worth folding in
later, but it has different boundary semantics (`\b` vs `_`-anchored) and
converging it needs its own before/after totals check.
