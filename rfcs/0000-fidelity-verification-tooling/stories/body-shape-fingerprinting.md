---
title: "api:compare: control-flow fingerprint similarity ranking (divergence radar)"
status: draft
updated: 2026-06-12
rfc: "0000-fidelity-verification-tooling"
cluster: api-compare
deps: ["options-kwargs-key-parity"]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`JoinDependency.construct` was rewritten away from Rails' design (6 params →
2, different hydration architecture) and nothing flagged it until 211
`BLOCKED: associations` skips accumulated (see
`scripts/api-compare/output/arity-mismatches.json` and the analysis doc
`trails/docs/activerecord/port-fidelity-analysis-2026-06-11.md`). This story
builds a **ranked divergence report** — explicitly NOT a gate, NOT a CI
check — that scores how structurally different each matched method-body pair
is, so audits start from the top of the list.

Fingerprint definition (keep exactly this, resist enriching): for each method
body, an ordered token sequence drawn from this alphabet:

- `IF` (if/unless/elsif/ternary/case-when branch, TS if/else-if/switch-case),
- `LOOP` (each/map/while/until/for, TS for/while/`.map`/`.forEach`),
- `RAISE` (Ruby raise, TS throw),
- `RET` (explicit return before the last statement),
- `CALL:<name>` — method-call name, emitted only when the name (after
  applying the `conventions.ts` Ruby→TS renames) appears in BOTH sides'
  extracted API name universe; all other calls are dropped, not tokenized.

Similarity = 1 − levenshtein(seqA, seqB) / max(len A, len B). Implement
levenshtein inline (~15 lines); no new dependency.

Implementation plan:

1. **Ruby side** (`scripts/api-compare/extract-ruby-api.rb`): the Ripper sexp
   for each method body is already in hand at extraction time; add a
   `fingerprint: [...]` array per method via a sexp walker emitting the
   alphabet above in source order. Gate behind `EMIT_FINGERPRINTS=1` env var
   so the default rails-api.json stays small.
2. **TS side** (`scripts/api-compare/extract-ts-api.ts`): same walker over
   the method's `ts.Node` body (visit in document order); same env gate.
3. **Report** — new `scripts/api-compare/fingerprints.ts` +
   `fingerprints.test.ts`: for each matched pair where both fingerprints
   exist and `max(len) >= 5` (skip trivial bodies — they're all "similar"),
   compute similarity; write
   `output/fingerprint-divergence.json`: `{generatedAt, scored, skippedTrivial,
results: [{package, rubyFile, tsFile, rubyName, tsName, similarity,
rubyLen, tsLen}]}` sorted ascending by similarity (most diverged first).
   Add an npm script `api:fingerprints` in trails root `package.json` that
   runs both extractions with the env var and then the report — do NOT wire
   it into `api:compare`/`run.sh` (it roughly doubles extraction work).

## Acceptance criteria

- [ ] `pnpm api:fingerprints --package activerecord` (flag pass-through like
      api:compare) produces `output/fingerprint-divergence.json` sorted most-
      diverged-first; normal `pnpm api:compare` runtime and outputs are
      unchanged.
- [ ] `fingerprints.test.ts` covers: identical sequences → 1.0, disjoint →
      0.0, CALL-name normalization (a Ruby `find_by` and TS `findBy` tokenize
      identically), trivial-body skip.
- [ ] Sanity anchor in the PR description: `JoinDependency`
      `construct`/`constructModel` (associations/join-dependency.ts) appear
      in the bottom (most-diverged) decile of the activerecord report; if
      they don't, explain why before merging.
- [ ] ≤500 LOC.

## Notes

This is a heuristic radar; false positives are fine (a human reads the top of
the list), false "everything is similar" is the failure mode — which is why
unmatched CALL names are dropped rather than emitted as a generic `CALL`
token (generic tokens inflate similarity).
