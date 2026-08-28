---
title: "parity-api-compares-parameter-names-beside-arity"
status: draft
updated: 2026-08-28
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`parity:api` checks arity (arel: 706/706) but never parameter names, so a
port that keeps the count and renames the parameters scores 100%. CLAUDE.md
makes parameter names a first-class fidelity rule ("a local or parameter
keeps the Rails identifier, camelCased — `stmt` not `statement`"), and two
successive arel audits each had to find renames by hand: the first found 12
(fixed in #7123, `arel-parameter-name-drift-sweep`), the second found the 4
that were left (`arel-parameter-name-drift-residue`) with a ~40-line script:

- for every Ruby `def name(params)` in a matched file, camelCase each
  parameter (`single_source` → `singleSource`, strip `*`/`&`/defaults/kwarg
  colons; `initialize` → `constructor`);
- for the TS member of the same name and the same arity, take each
  parameter's identifier (strip `?`, type, default, a leading `_`, and skip a
  `this:` parameter);
- report positions where they differ.

Run over `packages/arel/src` on 2026-08-28 it produced exactly the four
residual renames plus a handful of `?`-optional-vs-`= nil` matches it
correctly ignores. The same check would have made the first audit's 12
unnecessary, and it is the check arity already half-implements.

## Acceptance criteria

- `scripts/api-compare` gains a parameter-name comparison beside the arity
  one: for each matched pair with equal arity, each position's Ruby
  parameter (camelCased per `docs/ruby-ts-conventions.md`) is compared with
  the TS parameter identifier; a differing position is a `param-name` row
  keyed `file#method@position` with both spellings.
- Known-legitimate differences are recognised, not baselined: a Ruby keyword
  the TS name cannot use verbatim (`default`, `class`, `alias` → `aliaz`
  already is Rails' own spelling), a splat/kwargs collapsed into an
  `options` object, and a `this:` receiver parameter.
- `pnpm parity:api` prints a per-package `params N/M` figure next to
  `arity`; `parity:api --package arel` reports 0 rows after
  `arel-parameter-name-drift-residue` lands (and exactly its 4 before).
- Gating follows the existing pattern: report-only until seeded, then an
  only-shrink per-file mark with `tighten`, no reseed. Enrol arel first (it
  is at 0); other packages join by their own story.
- Unit tests over a fixture pair pin: rename → row; camelCase match → no row;
  keyword rename → no row; splat → options → no row.
