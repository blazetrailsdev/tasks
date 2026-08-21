---
title: "Converge ModelName#match's raise onto Ruby String#match?'s TypeError"
status: ready
updated: 2026-08-21
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ModelName#match` (`packages/activemodel/src/naming.ts`) raises trails' own
`ArgumentError("ModelName#match requires a RegExp")` for an operand that is
neither a RegExp nor a String. Rails delegates `match?` to `@name`
(`vendor/rails/activemodel/lib/active_model/naming.rb:151-152`, documented at
`:114-128`), so the raise that actually reaches a caller is Ruby
`String#match?`'s — `TypeError: wrong argument type nil (expected Regexp)`
(string.c `rb_str_match_m_p` → `get_pat`). Wrong error class, wrong message,
and a raise site trails invented rather than ported.

PR #6792 converged the String arm of this method (Ruby compiles a String
operand as the pattern) but deliberately left the raise alone as out of scope.

## Converged shape

`match` throws a `TypeError` with Ruby's message, built from the operand's
class the way `get_pat` does (`wrong argument type nil (expected Regexp)`,
`wrong argument type Integer (expected Regexp)`, …). The `lastIndex`
save/restore for `/g` and `/y` stays — Ruby `match?` is stateless.

Note `packages/activemodel/src/naming.test.ts` has a trails-only case named
`match throws ArgumentError on non-RegExp input`. Test names are never
renamed, so the assertions inside it change to expect `TypeError` while the
name stays as-is.

## Acceptance criteria

- `mn.match(null)` / `mn.match(undefined)` / `mn.match(42)` raise `TypeError`
  with Ruby's `get_pat` message, not trails' `ArgumentError`.
- The String and RegExp arms are unchanged, `lastIndex` still restored.
- `pnpm parity:api:calls` / `:args` clean; activemodel parity delta
  non-negative.
