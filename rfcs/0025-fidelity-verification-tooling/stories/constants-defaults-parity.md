---
title: "api:compare: literal parameter-default + constant parity report"
status: claimed
updated: 2026-06-13
rfc: "0025-fidelity-verification-tooling"
cluster: api-compare
deps: ["options-kwargs-key-parity"]
deps-rfc: []
est-loc: 250
priority: 16
pr: null
claim: "2026-06-13T13:19:11Z"
assignee: "constants-defaults-parity"
blocked-by: null
---

## Context

Literal values — parameter defaults (batch sizes, flags) and module-level
constants (lock names, limits) — can silently differ between Rails and trails;
nothing compares them. The signature plumbing already exists: the Ruby
extractor (`scripts/api-compare/extract-ruby-api.rb`) parses full signatures
(see `rubySig` strings like `(reflection, association, tracker)` in
`scripts/api-compare/output/arity-mismatches.json`), and the TS extractor
(`extract-ts-api.ts`) does the same (`tsSig` with `= …` markers). This story
upgrades "a default exists" to "the default's literal value", plus a constants
pass.

Implementation plan:

1. **Ruby side**: where the extractor records params, additionally record the
   default expression **only when it is a literal**: integer/float, string,
   symbol, `true`/`false`/`nil`, and empty `[]`/`{}`. Anything else (method
   calls, constants, lambdas) → record `default: {kind: "expr"}` and exclude
   from comparison. Also collect module/class-level constant assignments
   whose RHS is one of the same literal kinds, as
   `constants: {NAME: value}` per file.
2. **TS side** (`extract-ts-api.ts`): same for parameter initializers
   (literal kinds only; `[]`/`{}` only when empty) and for exported
   `const` / `static readonly` literal declarations in the same file.
3. **Compare** — new `scripts/api-compare/literals.ts` + `literals.test.ts`
   (clone the `arity.ts` report shape): for matched method pairs, compare
   positionally-matched literal defaults after normalization: symbol →
   string, `nil` → `null`/`undefined` (treat both TS forms as equal), Ruby
   string vs TS string verbatim. For constants, match names via the
   `conventions.ts` rename helpers (SCREAMING_SNAKE usually passes through).
   Write `output/literal-mismatches.json` (`generatedAt`, `compared`,
   `mismatched`, `mismatches: [{package, rubyFile, tsFile, name, rubyValue,
tsValue, kind: "default" | "constant"}]`) and print one advisory summary
   line in the api:compare output.

Known noise to handle explicitly (skip-with-reason in the comparer, with a
`skipped` count in the JSON): Ruby `1000` vs TS `1_000` (parse numerically),
single-vs-double-quoted strings (compare values), TS `undefined` default for
Ruby `nil`.

## Acceptance criteria

- [ ] `pnpm api:compare --package activerecord` writes
      `scripts/api-compare/output/literal-mismatches.json` + one summary
      line; advisory only.
- [ ] `literals.test.ts` covers: numeric equality across underscore formats,
      symbol→string, nil↔undefined/null, non-literal default exclusion, and
      one constant match.
- [ ] PR description lists every activerecord mismatch found on `main` at
      implementation time, each triaged in one line as real-divergence or
      extraction-noise (fix extraction noise before merging).
- [ ] Existing compare/arity/options outputs unchanged; ≤500 LOC.

## Notes

Depends on [[options-kwargs-key-parity]] only for the shared
conventions-rename usage pattern and to avoid concurrent edits to the two
extractors — coordinate if claimed in parallel.
