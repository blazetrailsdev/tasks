---
title: "Run the extra-surface tag gates in CI — stale/unclassified/file-tag gates are currently local-only"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6141
claim: "2026-08-05T20:33:08Z"
assignee: "mysql-schema-creation-memoizes-where-rails-allocates"
blocked-by: null
closed-reason: null
---

## Context

Found while adding the file-level tag gate in PR #5950: **`pnpm parity:api:extra` is
not run anywhere in CI.** `grep -rn "parity:api:extra\|extra-surface" .github/` returns
nothing, and `.github/workflows/ci.yml` is the only workflow.

That means every gate extra-surface.ts implements is advisory in practice,
enforced only when someone runs the script locally:

- `gateStale` — a `@noRailsEquivalent` tag on a name that no longer flags
  (extra-surface.ts, "STALE ... fails the run").
- `gateUnclassified` — a reason stating neither `PERMANENT` nor `CONVERGEABLE`.
  RFC 0080 brought this population to a hard 0 specifically so it could be a
  gate rather than a ratchet.
- `gateFileTagRejections` — new in #5950; refuses a file-level tag when a Rails
  counterpart file exists or any name in the file scores `moved`.

Each of these is written and documented as "fails the run", and the exit code is
correct — nothing invokes it. So a PR can delete a Rails method, leave the tag
that excused its TS counterpart behind, and go green; or write a file-level
blanket over a file whose names are all `moved`, and go green. The gates were
designed as hard gates and are currently a lint you have to remember to run.

Note the cost side honestly: `parity:api:extra` needs the `parity:api` manifests,
which need `pnpm build` first (the build-freshness guard refuses a stale
manifest). If the api-compare manifests are already produced by an existing CI
job, this is close to free; if not, the story has to decide whether the gate
rides an existing job or justifies its own.

## Acceptance criteria

- `pnpm parity:api:extra` (or the specific gates) runs in CI on every PR, failing the
  build on a stale tag, an unclassified reason, or a refused file-level tag.
- The job reuses the existing api-compare manifest/build work rather than
  re-running `pnpm build` from scratch, or the PR states why that is not
  possible and what the added wall-clock cost is.
- A deliberately broken tag (e.g. a `@noRailsEquivalent` on a name that does not
  flag) is shown to turn the new job red — the gate is demonstrated, not assumed.
- `--exclude-glob` runs still skip the stale gate, matching the existing
  reasoning in `main()` that an exclusion can hide a tag but never invent one.
