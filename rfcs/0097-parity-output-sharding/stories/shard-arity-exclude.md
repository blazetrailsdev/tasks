---
title: "Shard arity-exclude.json into a per-Ruby-file tree"
status: ready
updated: 2026-08-10
rfc: "0097-parity-output-sharding"
cluster: api-compare
packages: []
deps: ["shared-shard-helper"]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/arity-exclude.json` is the last non-empty monolithic
committed register keyed by a source file. It holds **one row** today:

```json
[
  {
    "package": "activerecord",
    "rubyFile": "database_configurations/url_config.rb",
    "rubyName": "build_url_hash",
    "reason": "…"
  }
]
```

Key shape at `arity-exclude.ts:25-29` (`package` + `rubyFile` + `rubyName`),
with the header at `:7` recording that it is keyed on the **Ruby** side of the
pair — so its shard path is `<package>/<rubyFile .rb→.json>`, not the `.ts`
mapping the call gate hardcodes. `keyOf` at `:36` and the unknown-package
validation at `:64-69` are the guards that must survive the merge.

Enforced by `scripts/api-compare/lint-arity-excludes.ts`, run at
`.github/workflows/ci.yml:1395` inside the `Rails API/Test Comparison` job (see
the comment at `:1392` naming the file by path).

Its single row makes this the safest possible first exercise of the shared
helper on a Ruby-keyed register, and it is the story that proves the
extension-parameter generalization actually works end to end.

## Acceptance criteria

1. `arity-exclude.json` becomes `arity-exclude/`, one JSON array per Ruby
   source file at `<package>/<rubyFile .rb→.json>`, loaded via `loadSharded`
   from the RFC 0097 shared helper.
2. The merged set is **equal** to today's parsed file — same one row, same
   `reason` string byte-for-byte. No row added, removed, or reworded.
3. Duplicate-key detection, unknown-package validation (`arity-exclude.ts:64-69`),
   and any partial-scope guard run **after** the merge and report identically to
   the monolithic case. Add a test that a duplicate key spanning two shards is
   reported the same as one within a single shard.
4. The row's `package` field must agree with its shard's directory; a
   disagreement throws.
5. `arity-exclude.test.ts` passes with only the fixture-loading mechanics
   changed.
6. Registrations updated: `scripts/parity/README.md` table row at `:46` flipped
   to `exclude (sharded)`; the CI comment at `ci.yml:1392` and any prose in
   `CONTRIBUTING.md` / `docs/` naming `arity-exclude.json` updated to the
   directory form. Verify no CI path filter names the file explicitly.
7. Writes go through `serializeBaseline` only; converged shards are deleted,
   not written as `[]`.
8. The PR body records the pre-migration file's last commit sha, since
   file→directory breaks `git log --follow`.
