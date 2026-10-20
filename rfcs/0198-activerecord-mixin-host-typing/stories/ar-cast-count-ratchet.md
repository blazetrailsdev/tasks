---
title: "Per-file only-shrink count ratchet for activerecord casts"
status: done
updated: 2026-10-20
rfc: "0198-activerecord-mixin-host-typing"
cluster: cast-ratchet
packages: [activerecord]
deps:
  [
    ar-type-persistence-core-base,
    ar-type-reflection,
    ar-type-relation-query-methods,
    ar-type-attribute-methods-model-schema,
    ar-type-associations,
    ar-type-connection-adapters-abstract,
    ar-type-test-helper-models,
    ar-type-remaining-src,
  ]
deps-rfc: []
est-loc: 250
priority: null
pr: trails#9129
claim: "2026-10-20T13:57:57Z"
assignee: "ar-cast-count-ratchet"
blocked-by: null
closed-reason: null
---

## Context

RFC § "The ratchet". `packages/activerecord/src` (non-test) holds 1741
lines matching `this: any` / `(this as any|unknown` / `as any` /
`as unknown as` (trails main `0996faab65`, 2026-10-19). RFC 0037's
`eslint/no-explicit-any-src-exclude.json` is a binary per-file allowlist and
does not see `as unknown as`, so nothing stops the count growing.

Model it on `scripts/api-compare/param-name-mark.ts` / `.json` and the
`parity:api:params` / `:tighten` scripts in `package.json`.

```sh
grep -rcE 'this: any\b|\(this as (any|unknown)|\bas any\b|as unknown as' --include='*.ts' --exclude='*.test.ts' packages/activerecord/src
```

It lands **after** every cluster story, seeded once from the remaining
counts. A per-file mark JSON tightened by parallel stories is a merge-conflict
magnet, so no mark file exists during the burndown.

## Acceptance criteria

Owner ruling on trails#9129: no committed mark file (it is a merge-conflict
magnet). The mark is the count at the merge-base with `origin/main`, so there
is no `--seed` and no `:tighten`.

- [ ] Every story in `deps` is done before this lands.
- [ ] A script counts matching lines per file (`grep -cE` semantics, the RFC's exact regex) over non-test `packages/activerecord/src` and compares each file against its count at `git merge-base origin/main HEAD`.
- [ ] Its total equals the sum of the RFC's `grep -rcE` on the same tree (asserted in the unit test or CI); the PR states the count at landing.
- [ ] `pnpm parity:types:casts` fails on any file above its base count, and on a file absent at the base with a non-zero count.
- [ ] No mark file is committed; nothing can raise the bar.
- [ ] Unit test for the comparison (above base, new file, below base passes).
- [ ] Runs in CI's Preflight job.
- [ ] The RFC's open question (gate name and home) is answered in the PR.
