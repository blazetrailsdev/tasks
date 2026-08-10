---
title: "Retire prism-codegen and its two CI gates"
status: closed
updated: 2026-08-05
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: ["call-sequence-parity-in-wide-ratchet"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by the 2026-08-05 prism-codegen coverage audit: the generator is being retired (0084-wide-call-set-burndown/retire-prism-codegen-tooling), so improving its output is work on a deleted directory. Evidence: 0 shipped lines from codegen:apply, 963 tsc errors across all 10 emitted files, 81.8% whole-corpus node coverage that does not translate to usability."
---

## Context

Retire `scripts/prism-codegen/` and its two CI gates. This is the terminal
outcome of RFC 0086: the audit it called for was run (2026-08-05, audit report
`prism-codegen-coverage-20260805T143753Z.md`) and the evidence says productionizing
the generator is not worth it, while its one unique gate signal is cheaper to
obtain elsewhere.

**No generated code has ever shipped.** `apply.ts:APPLY_MARKER` — the loud
greppable draft marker `codegen:apply` inserts — appears in no commit touching
`packages/` (`git log --all -S'PRISM-CODEGEN DRAFT' -- packages/` is empty).
`codegen:apply` landed in #5819 and has never produced a port line.

**No generated code is close to usable.** All 10 files `pnpm codegen:generate`
emits produce **963 TypeScript errors** under `checkJs` (472 × TS2304 undefined
name, 340 × TS2339 property-does-not-exist, 25 × TS2307 unresolved import) —
every file, including `out/relation/calculations.js`, which is the corpus best
case at 95.1% node coverage and flagged `tractable` + `deepDrill` in
`files.ts:47`. Its first 40 lines contain `new Hash(0)` (Ruby Hash, undefined in
JS), `.gsubBang()` / `.stripBang()` (Ruby String methods on a JS string), a bare
`require("active_support/core_ext/enumerable")` inside an ESM file, and Ruby's
unary `+` (unfreeze-string) emitted as JS unary `+` (numeric coercion — silent
corruption). Closing the gap needs a Ruby core-library shim, a Ruby-constant →
trails-module import map, and a type layer; each is larger than the existing
9,173-line tool.

**Whole-corpus coverage is worse than published and structurally capped.**
Measured over all 305 files under
`vendor/rails/activerecord/lib/active_record/**` (94,543 dispatched nodes):
**81.8%** node coverage, against the 91.8% `codegen:generate` reports on its
10-file sample. Distribution is sharply bimodal — 200 files at 90–100%, 28 files
at 0–10% — and the near-zero cohort is one syntactic rule
(`handlers/structure.ts:129` drops any class-body subtree containing a nested
`ClassNode`/`ModuleNode`: 10,823 nodes, 62 files). More node coverage does not
move the output toward usability, because the gap is stdlib semantics, imports
and types, not AST coverage.

**The guard it does provide is a worse-scoped duplicate of `parity:api:calls`.**
`codegen:score --guard` (`ci.yml:1429`) scores 10 Ruby files / 433 defs, of
which **362 of 391 divergent+missing rows are unreviewed baselined residue**
(`convergence-baseline.json`; 15 catalogued, 14 signed off). `parity:api:calls`
covers 1,462 distinct methods across 12 packages with every row carrying a
reviewed reason. The codegen guard is also uniquely fragile: its generated side
is a function of 7 handler files plus `port-symbols.ts` and `async-source.ts`,
so it reds on generator changes rather than port changes — already recorded as
`project_codegen_handler_coverage_surfaces_guard_rows` ("new codegen handler
reds the convergence guard; newly-clean defs surface PRE-EXISTING port
divergence"). Sampling 18 divergent rows, roughly a third were generator or
resolver artifacts, not port divergence (e.g. `ref:cache_keys` vs `ref:cacheKeys`,
because `expressions.ts:157 ivar()` never camelCases — 1,129 snake_case tokens
across the 10 emitted files).

Ongoing carrying cost: 9,173 lines of tool plus 4,350 lines of golden snapshots
that re-baseline on every handler change **and** every `pnpm vendor:fetch`, and
two CI jobs (`ci.yml:1429` score guard, `ci.yml:1437` golden suite) policing
output nobody consumes.

**Dependency:** this story must land _after_ RFC 0084's
`call-sequence-parity-in-wide-ratchet`, which ports the ordered call-sequence
comparison — the codegen guard's one genuine unique signal — into
`parity:api:calls`. Deleting before that lands drops a real fidelity check.

## Acceptance criteria

- The ordered call-sequence comparison is live in `parity:api:calls` (RFC 0084
  story) before this story's deletion commit; verify, do not assume.
- `scripts/prism-codegen/` is deleted, including `convergence-baseline.json`
  (362 rows), `convergence-signoff.json` (14 rows), `guard.ts`, `signoff.ts`,
  `catalog.ts`, `score.ts`, `apply.ts`, and `__snapshots__/` (4,350 lines).
- Both CI jobs are removed: the score guard at `.github/workflows/ci.yml:1429`
  and the golden suite at `ci.yml:1437`. `scripts/prism-codegen` is removed from
  `UNIT_TESTS_PKGS_RE` (`ci.yml:111`), from `COMPARISON_RE` (`ci.yml:115`), and
  from the path list at `ci.yml:539` — all three registrations, per
  `project_new_scripts_test_dir_needs_three_registrations`.
- The five `codegen:*` scripts are removed from `package.json:62-66`.
- The two `// prism-mro:` markers in `packages/activerecord/src/base.ts:3130`
  and `:3214` are resolved: either the MRO check in `composition.ts` is kept as
  a standalone module with its own gate, or the markers are deleted with the
  rest. Do not leave the directory alive solely to host them.
- `docs/infrastructure/prism-codegen-spike.md` records the outcome and the
  measured evidence, so the spike reads as concluded rather than abandoned.
- `pnpm typecheck`, `pnpm parity:api` and `pnpm parity:test` deltas are
  non-negative; `@ruby/prism` is dropped from dependencies if nothing else
  consumes it.

## Not in scope

The generator-improvement work the audit inventoried (nested class/module
declarations, negative literals, `class << self` at module scope, `BeginNode`,
snake_case identifiers) is deliberately **not** scheduled — it improves output
that is being deleted. It is recorded in the audit report for the record only.
