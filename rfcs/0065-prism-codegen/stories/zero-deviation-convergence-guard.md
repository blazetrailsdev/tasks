---
title: "zero-deviation-convergence-guard"
status: closed
updated: 2026-07-17
rfc: "0065-prism-codegen"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Spike PR #4912 closed — deterministic codegen not useful enough for the backlog; direction abandoned."
---

## Context

RFC 0065 (`docs/infrastructure/prism-codegen-spike.md`). The repo's goal is
**zero deviations** from Rails, so the generator's most valuable output is not
its coverage % but a structural diff of the generated (Rails-faithful) JS
against the trails port, filtered by the deviation catalog.

Manual analysis of the 10 generated files vs their trails counterparts found
that every "missing" symbol resolves to one of: (a) a catalogued exception —
`SKIP` (Ruby Object-protocol methods like `encode_with`/`to_ary`),
`SCOPED_SKIP` in `scripts/api-compare/conventions.ts` (`build_count_subquery`,
`perform_calculation`), or the api-compare exclude lists
(`scripts/api-compare/call-mismatches-wide-exclude.json` — the `async_*`
family; `call-mismatches-exclude.json` — `_create_record` confirmed-equivalent);
or (b) a generator false positive: predicate-candidate ambiguity
(`rubyMethodToTs("exists?")` → `["isExists","exists"]`, generator picks first,
port uses `exists`) and file-scoped symbol lookup (a method ported into a
different file than its Rails home reads as missing, e.g. `_createRecord` lives
in `callbacks.ts`/`dirty.ts`, not `persistence.ts`).

So after subtracting the catalog and the two artifact sources, the residual for
the 10 most-central files is **empty** — evidence the central surface is
faithfully ported, and the basis for a regression tripwire on new ports.

## Acceptance criteria

- Add a `pnpm codegen:deviation-guard` (or a flag on the existing CLI) that, for
  a given ported `.ts` (or all 10 targets), diffs generated Rails-named symbols
  against the port's symbols and prints only the residual after filtering:
  - the `SKIP` / `SCOPED_SKIP` sets and the api-compare exclude JSONs, and
  - the two false-positive suppressors: (a) accept ANY candidate from
    `rubyMethodToTs` (not just the first) as a match; (b) resolve symbols
    across the whole `packages/activerecord/src` tree, not just the twin file.
- On the current tree the guard's residual is empty for all 10 targets (assert
  this in a test so a regression surfaces).
- Document the guard in RFC 0065 as the "zero-deviation" use of the tool.
- Do NOT wire it into CI in this story (evaluate signal first); note the CI
  follow-up if the residual proves stable.
