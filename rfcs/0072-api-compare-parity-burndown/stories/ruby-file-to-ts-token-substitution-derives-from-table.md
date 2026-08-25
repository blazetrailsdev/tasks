---
title: "rubyFileToTs restates the erb token instead of deriving it from TOKEN_RENAMES"
status: done
updated: 2026-08-06
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 6146
claim: "2026-08-05T23:53:11Z"
assignee: "pg-schema-statements-abstract-signature-divergences"
blocked-by: null
closed-reason: null
---

## Context

`applyTokenRenames` now derives its alternation from `TOKEN_RENAMES`
(`scripts/api-compare/conventions.ts`, PR #6143), closing the table/regex drift
class for identifiers. The parallel substitution for FILE PATHS in
`rubyFileToTs` (same file, the `/\berb\b/g` replacements) is still a third
hard-coded spelling of the same idea and was explicitly out of scope there.

It has different boundary semantics — `\b` rather than `_`-anchored with a
`(?=_|$|[A-Z])` lookahead — so it cannot simply reuse `TOKEN_RENAME_PATTERN`.
A new `TOKEN_RENAMES` entry today silently applies to method names and NOT to
file paths, which is the same failure mode the `rb` entry had (PR #6017 added it, PR #6043 fixed it, dead code the whole time in between).

## Converged shape

One table, two derived patterns: keep `TOKEN_RENAMES` the single source of
truth and build a second, `\b`-bounded pattern from the same keys (longest-key
first, keys escaped) for `rubyFileToTs`. Extend the reachability test added in PR #6143 so every key is asserted reachable through the file-path substitution too.

## Acceptance criteria

- [ ] `rubyFileToTs` derives its pattern from `TOKEN_RENAMES` rather than
      restating `erb`.
- [ ] A test asserts every `TOKEN_RENAMES` key is reachable via the file-path
      path, not only via `snakeToCamel`.
- [ ] `pnpm parity:api` per-package totals unchanged (behavior-preserving);
      diff the full table with a fresh `pnpm build` on both sides.
- [ ] `pnpm parity:api:conventions` regenerates `docs/ruby-ts-conventions.md` with no
      diff.
