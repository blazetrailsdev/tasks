---
title: "Per-file only-shrink count ratchet for activerecord casts"
status: ready
updated: 2026-10-19
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
pr: null
claim: null
assignee: null
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

- [ ] Every story in `deps` is done before this lands; a late cluster story blocks the ratchet rather than seeding above its result.
- [ ] A script counts matching lines per file (`grep -cE` semantics, the RFC's exact regex) over non-test `packages/activerecord/src` and compares against a committed per-file mark JSON.
- [ ] Its total equals the sum of the RFC's `grep -rcE` on the same tree (asserted in the unit test or CI).
- [ ] The mark file is produced by a one-time `--seed` run of the same script, which refuses when a mark file already exists; the seed PR states the seeded total.
- [ ] `pnpm parity:types:casts` fails on any file above its mark and on a rowless file with a non-zero count.
- [ ] `pnpm parity:types:casts:tighten` only writes marks down and drops zero rows; there is no reseed or write-up path.
- [ ] Unit test for the mark logic (above-mark, new file, tighten-only-down).
- [ ] Runs in CI's Preflight job.
- [ ] The RFC's open question (gate name and home) is answered in the PR.
