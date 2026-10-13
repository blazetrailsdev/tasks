---
title: "test-compare: add an --extra flag that lists each file's TS-only tests"
status: ready
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test` counts each convention file's extra (TS only) tests but cannot list them.
`scripts/test-compare/compare.ts` computes the count as `tsTests.length - consumedTs.size` (the
`const extra` line in the per-file loop) and keeps only the number on the file result; `--sort-extra` and
`--min-extra=N` sort and filter the table by it. Every `activerecord-relocate-ts-only-tests-*` story under
this RFC starts by finding which tests are the extras, and today that means patching `compare.ts` locally to
print the unconsumed `tsTests` entries (done for trails#8848).

`--missing` is the existing precedent: it adds `missingTests` to the file result and prints them.

## Acceptance criteria

- [ ] A `--extra` flag lists, per convention file, the describe path and name of each TS test no Rails test consumed, and adds them to the `--json` output as `extraTests`.
- [ ] It composes with `--package`, `--sort-extra` and `--min-extra=N`.
- [ ] `scripts/test-compare/compare.test.ts` covers the flag.

## Verification

```bash
pnpm parity:test --package activerecord --extra --min-extra=1
```
