---
title: "Shard body-pins.json and inheritance-exclude.json"
status: ready
updated: 2026-08-10
rfc: "0097-parity-output-sharding"
cluster: api-compare
packages: []
deps: ["shared-shard-helper"]
deps-rfc: []
est-loc: 260
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Two committed registers are **empty arrays** today and are keyed on the Ruby
side of the pair, exactly like `arity-exclude`:

- `scripts/api-compare/inheritance-exclude.json` — `[]`. Keyed
  `package + rubyFile + rubyFqn` (`inheritance-exclude.ts:12,29`). Enforced by
  `lint-inheritance-excludes.ts`, run at `.github/workflows/ci.yml:1401` (the
  comment at `:1398` names the file by path).
- `scripts/api-compare/body-pins.json` — `[]`. Keyed
  `package + rubyFile + rubyName` (`body-pins.ts:86-101`), with a partial-scope
  guard at `:105-111` that checks `artifact.packages` so a `--package`-scoped
  run does not flag every uncompared package's pins as STALE, and a
  documented-but-unavailable helper reuse at `:168` ("body-pins keys on
  `rubyFile`, not `tsFile`/call") — the exact prose RFC 0097's shared helper
  retires. Enforced by `lint-body-pins.ts`, run at `ci.yml:1424`.

Because both are empty, the migration is structural only: the merged set before
and after is `[]`, and the interesting work is proving the _loader_ and the
_guards_ behave identically on a populated tree via tests rather than via
committed rows. They are bundled because they share the helper, the key shape,
the CI job, and the register-table row format, and neither is large enough to
justify its own PR.

Under RFC 0097's empty-file policy (no file for zero rows), a register with
zero rows is an **empty directory**, which git does not track. Each tree
therefore needs a `.gitkeep` or equivalent so the directory exists in a fresh
checkout and the glob does not fault — decide and state which, and make the
loader tolerate a missing directory as "zero rows" either way.

## Acceptance criteria

1. `inheritance-exclude.json` → `inheritance-exclude/` and `body-pins.json` →
   `body-pins/`, both loaded through the RFC 0097 shared helper with
   `rubyFile` / `.rb` as the source-field and extension parameters.
2. Merged set for each is `[]`, identical to today.
3. A missing or empty tree loads as zero rows without throwing, and a fresh
   `git clone` reproduces the tree (state the `.gitkeep`-or-equivalent choice
   in the PR body).
4. `body-pins`' partial-scope guard (`body-pins.ts:105-111`) evaluates against
   the **merged** set. Test: a `--package`-scoped run over a populated
   multi-shard tree does not flag other packages' pins as STALE.
5. Duplicate-key detection across two shards reports identically to the
   single-array case, for both registers. Row `package` must agree with shard
   directory or throw.
6. `inheritance-exclude.test.ts` and `body-pins.test.ts` pass with only
   fixture-loading mechanics changed.
7. Registrations: `scripts/parity/README.md` rows at `:47-48` flipped to
   `(sharded)`; CI comments at `ci.yml:1398` and `:1423` updated to the
   directory form; any `docs/` or `CONTRIBUTING.md` prose naming either file
   updated.
8. `serializeBaseline` remains the only writer. Converged shards are deleted,
   not written as `[]`.
9. The PR body records each pre-migration file's last commit sha.
