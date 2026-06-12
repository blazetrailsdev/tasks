---
title: "api:compare: per-method Ruby option-key vs TS options-interface diff"
status: ready
updated: 2026-06-12
rfc: "0025-fidelity-verification-tooling"
cluster: api-compare
deps: []
deps-rfc: []
est-loc: 400
priority: 15
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

api:compare matches method **names** and (via `scripts/api-compare/arity.ts`)
**positional arity**, but never option-hash keys — so a TS options interface
missing a key Rails accepts is invisible. This story adds an advisory
options-key sub-report, cloning the arity-checker shape end to end:
`arity.ts` → `output/arity-mismatches.json` → one summary line in
`scripts/api-compare/run.sh` output.

Implementation plan (all paths relative to trails repo root):

1. **Ruby side** — in `scripts/api-compare/extract-ruby-api.rb` (Ripper-based;
   method param extraction already exists around the "Param extraction from
   Ripper AST" section, ~L60): for each public method that has a param named
   `options` / `opts` or a `**` kwargs param, walk the method-body sexp and
   collect symbol keys from these node shapes:
   - `options[:foo]` (aref with symbol literal),
   - `options.fetch(:foo, …)` / `options.delete(:foo)` / `options.key?(:foo)`
     / `options.include?(:foo)`,
   - `options.assert_valid_keys(:a, :b, …)` and constant arrays named
     `VALID_OPTIONS`/`valid_options` in the same class body (take the symbol
     list verbatim).
     Emit as `option_keys: [...]` (sorted, deduped) on the method entry in
     `output/rails-api.json`. Methods with no detectable keys emit nothing.
2. **TS side** — in `scripts/api-compare/extract-ts-api.ts` (TS compiler API):
   for each extracted method whose last (or only) parameter type resolves to
   an object type (interface/type-literal/intersection), record its resolved
   property names via `checker.getPropertiesOfType(...)` as `optionKeys`.
   Skip params typed `any`/`unknown`/`Record<string, unknown>` (emit
   `optionKeys: null` to mean "uncheckable", distinct from `[]`).
3. **Compare** — new `scripts/api-compare/options-keys.ts` (mirror the
   structure of `arity.ts` including its test file `arity.test.ts`): for each
   matched method pair where Ruby emitted `option_keys` and TS emitted a
   non-null `optionKeys`, diff after normalizing Ruby symbols to the TS
   naming conventions (reuse the rename helpers in
   `scripts/api-compare/conventions.ts` — snake_case→camelCase plus the token
   renames; do NOT reimplement). Report `missingInTs` and `extraInTs`
   per pair. Write `output/options-key-mismatches.json` with the same
   header shape as `arity-mismatches.json` (`generatedAt`, `compared`,
   `mismatched`, `mismatches: [{package, rubyFile, tsFile, rubyName, tsName,
missingInTs, extraInTs}]`).
4. **Surface** — add one line to the api:compare summary (where the arity
   line prints) reporting `compared`/`mismatched`, advisory only (exit code
   unchanged).

Heuristic honesty: dynamic key access and keys consumed in callees make the
Ruby set an UNDER-approximation — so only `missingInTs` is a likely-real
finding; `extraInTs` is informational. Say so in the report README/JSON
comment field.

## Acceptance criteria

- [ ] `pnpm api:compare --package activerecord` additionally writes
      `scripts/api-compare/output/options-key-mismatches.json` and prints a
      one-line summary; exit code/CI behavior unchanged.
- [ ] Unit tests: `options-keys.test.ts` covers symbol normalization
      (`:inverse_of` → `inverseOf`), the null-vs-empty TS distinction, and at
      least one fixture pair with a known missing key. Ruby extraction
      covered by a fixture `.rb` snippet test if the repo has Ruby-extractor
      tests; otherwise assert on the JSON produced from a small vendored
      file.
- [ ] Spot-check in the PR description: run on `associations.rb` /
      `query_methods.rb` and list 3 confirmed-real `missingInTs` findings (or
      state none found).
- [ ] No behavior change to existing compare/arity outputs
      (`compare.test.ts`, `arity.test.ts` pass). ≤500 LOC.

## Notes

Run prerequisite: `pnpm lint:deps` shows how the Ruby extractor is invoked
(`LIB_PATHS_JSON=… ruby scripts/api-compare/extract-ruby-api.rb`); the normal
`pnpm api:compare` path is `bash scripts/api-compare/run.sh`. Do not rename
existing JSON fields — `prelint` and the eslint manifests consume them.
