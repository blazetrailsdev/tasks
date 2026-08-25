---
title: "Converge the four guard rows the literal/regex images surfaced"
status: closed
updated: 2026-08-05
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by the 2026-08-05 prism-codegen coverage audit: the generator is being retired (0084-wide-call-set-burndown/retire-prism-codegen-tooling), so improving its output is work on a deleted directory. Evidence: 0 shipped lines from codegen:apply, 963 tsc errors across all 10 emitted files, 81.8% whole-corpus node coverage that does not translate to usability."
---

## Context

PR #6112 (`literal-regex-longtail-images`) gave prism-codegen images for
`InterpolatedSymbolNode`, `InterpolatedRegularExpressionNode`, `SourceFileNode`,
`SourceLineNode`, `MatchWriteNode` and the back-reference reads. Four AR defs
that previously emitted `__PRISM_TODO(...)` became cleanly generated as a
result, so the convergence guard started scoring their bodies — and their ports
already diverged from the generated image:

- `active_record/inheritance.rb::computeType::divergent`
- `active_record/persistence.rb::incrementBang::divergent`
- `active_record/relation/query_methods.rb::extractTableNameFrom::divergent`
- `active_record/relation/query_methods.rb::isTableNameMatches::divergent`

The four rows were added to `scripts/prism-codegen/convergence-baseline.json` by
hand (no `--write` reseed) so the guard stayed green. That baseline is a
burndown ledger, not a decision: each row says the TS body no longer matches the
Ruby one.

The generated images are in
`scripts/prism-codegen/__snapshots__/inheritance.js.snap`,
`persistence.js.snap` and `relation/query-methods.js.snap` — read the image
next to the port and converge the port, not the image.

Same shape as `converge-guard-rows-surfaced-by-blocks-conditionals-coverage`.

## Converged shape

Each of the four TS bodies matches its Rails counterpart
(`vendor/rails/activerecord/lib/active_record/inheritance.rb`,
`persistence.rb`, `relation/query_methods.rb`) closely enough that the guard
scores it clean, and its baseline row is deleted by hand.

## Acceptance criteria

- [ ] The four bodies converge against the vendored Rails source.
- [ ] The four rows are removed from `convergence-baseline.json` (deleted, not
      reseeded — a reseed rewrites the whole tree).
- [ ] `pnpm codegen:score --guard` is green with a smaller baseline.
