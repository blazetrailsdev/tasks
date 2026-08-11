---
title: "Comparator: enforce the Symbol-vs-String discriminator on call arguments, not just parameter defaults"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6368
claim: "2026-08-11T16:13:43Z"
assignee: "naming-burndown-ar-field-and-body-restructures"
blocked-by: null
closed-reason: null
---

## Context

`call-args-tool-symbol-colon-literals` (PR #6351) shipped acceptance criterion 1
— a colon-kept TS string now compares equal to a Ruby Symbol of the same name —
but **criterion 2 is unmet and was disclosed rather than half-built**: "a TS
string WITHOUT the colon still mismatches a Ruby Symbol" is not enforced, for
ANY value, identifier-shaped or not.

The cause is upstream of that story's diff. `scripts/api-compare/literals.ts:31-33`
collapses the `symbol` and `string` kinds onto one colon-less key:

```ts
case "string":
case "symbol":
  return `str:${canonString(String(lit.value ?? ""))}`;
```

so a bare TS string already matched a Ruby Symbol before PR #6351 and still
does. `keptSymbolColon` (`call-args.ts`) only ever ADDS a match — colon-kept ↔
bare — and by construction cannot introduce a mismatch.

`compareLiteral` in the same file DOES have the discriminator
(`symbolDiscriminated`, `literals.ts:61-75`), but it is populated only for
PARAMETER DEFAULTS: the Ruby extractor sets `ParamInfo.symbolDiscriminated` when
a body branches on `Symbol === x`, and there is no per-ARGUMENT equivalent on
`CallSite`. So the strict arm cannot be reached from the call-argument path
today.

CLAUDE.md ("Symbols vs strings") is the rule this protects: where a body's
control flow turns on Symbol-vs-String, the port MUST keep the leading colon,
and a port that dropped it has changed behaviour. That class of divergence is
currently invisible in the call-argument dimension.

## Converged shape

Either (a) the Ruby extractor records, per call-argument site, whether the
callee's body discriminates that position on `Symbol`, mirroring how
`symbolDiscriminated` is derived for parameters, and `argKeysEqual` uses the
strict arm there; or (b) the argument key keeps the `sym:` kind distinct from
`str:` and equality is decided in `argKeysEqual`, which needs a measured pass
over the rows it would newly flag.

Whichever route, the measurement comes first: count how many rows a strict arm
would add before changing the default, and do not trade a documented gap for a
wave of false rows.

## Acceptance criteria

1. A Ruby Symbol argument at a Symbol-discriminated position mismatches a
   colon-less TS string.
2. A Symbol at a non-discriminated position keeps matching both spellings, as
   `compareLiteral`'s non-discriminated arm does — no behaviour change there.
3. The row delta is measured and reported before/after; any new rows are
   genuine divergences with a cited Rails `file:line`, not baselined wholesale.
4. `pnpm parity:api:calls:args` green.
