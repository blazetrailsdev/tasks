---
title: "An empty committed shard makes the reseed-drift check report a false diff"
status: done
updated: 2026-08-17
rfc: "0108-call-gate-false-positives"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6665
claim: "2026-08-17T19:08:15Z"
assignee: "closure-resolves-foreign-receiver-calls-as-same-file-methods"
blocked-by: null
closed-reason: null
---

## Context

Found in PR #6657 while running the mandatory reseed-drift check before adding
a baseline row (`pnpm tsx scripts/api-compare/lint-call-mismatches.ts --write`
must be a no-op over the rows you touched).

`scripts/api-compare/call-mismatches-exclude/activerecord/explain.json` is
committed containing exactly `[]`. The reseed DELETES it, because an empty
shard carries no rows and the writer does not emit a file for one. So a
`--write` run on a clean tree produces a diff that has nothing to do with the
caller's change:

```text
 .../call-mismatches-exclude/activerecord/explain.json | 1 -
```

That matters because CI's `Rails API/Test Comparison` job has a step after the
ratchet that runs the reseed and fails on ANY diff
(`::error title=Ratchet baseline drift`). The file was restored untouched in
PR #6657 rather than swept into an unrelated diff, so the drift is still
present on `main`.

The cost is not the file itself — it is that the reseed-drift check is the one
tool that tells an author whether their new baseline row landed in the right
slot, and it currently reports a false positive to everyone who runs it. That
is how a genuine misplaced row gets waved through.

## Converged shape

Delete the empty shard, and make the invariant hold going forward: either the
writer never emits an empty shard (and a stray one is removed by the reseed, as
today) or it always emits one. Whichever way, a clean-tree `--write` must be a
no-op. Check for other empty shards in the same pass.

## Acceptance criteria

- `pnpm tsx scripts/api-compare/lint-call-mismatches.ts --write` on a clean
  checkout of `main` produces no diff under
  `scripts/api-compare/call-mismatches-exclude/` or
  `scripts/api-compare/call-mismatches-unreviewed/`.
- No empty (`[]`) shard files remain committed under either tree.
- `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.
