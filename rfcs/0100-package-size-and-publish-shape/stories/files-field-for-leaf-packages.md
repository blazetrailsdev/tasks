---
title: "Add files field to date, did-you-mean, globalid, i18n"
status: draft
updated: 2026-08-11
rfc: "0100-package-size-and-publish-shape"
cluster: null
packages: ["date", "i18n", "globalid", "did-you-mean", "activerecord"]
deps: []
deps-rfc: []
est-loc: 40
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Four workspace packages in activerecord's dependency closure have **no `files`
field** in their `package.json`, so `npm pack` includes everything not
gitignored — their `src/`, `tsconfig.json`, `tsconfig.tsbuildinfo`, and
`dx-tests/`. Verified by extracting each packed tarball:

```text
@blazetrails/date          dist NOTICE package.json src tsconfig.json tsconfig.tsbuildinfo
@blazetrails/did-you-mean  dist NOTICE package.json src tsconfig.json tsconfig.tsbuildinfo
@blazetrails/globalid      dist dx-tests package.json src tsconfig.json tsconfig.tsbuildinfo
@blazetrails/i18n          dist NOTICE package.json src tsconfig.json tsconfig.tsbuildinfo
```

Measured overhead of the non-`dist` payload: date 0.64 MB, i18n 0.38 MB,
globalid 0.22 MB, did-you-mean 0.09 MB — **1.33 MB** of a 44.77 MB closure.
`globalid` additionally ships its `dx-tests/`, and `globalid` has no LICENSE or
NOTICE file at all while its three siblings do.

`activerecord`, `activemodel`, `activesupport` and `arel` already declare
`files: ["dist"]`; this is just the four that were never brought in line.

Bundled with this because it is the same file and the same PR: `activerecord`'s
`"files"` array lists `bin` (`packages/activerecord/package.json:97`) but
`packages/activerecord/bin` does not exist. Dead config.

## Acceptance criteria

1. `date`, `did-you-mean`, `globalid`, `i18n` each declare a `files` field
   covering exactly what a consumer needs (`dist` plus license/notice files).
2. `npm pack --dry-run --json` for each shows no `src/`, `tsconfig.json`,
   `tsconfig.tsbuildinfo` or `dx-tests/` entries; before/after `unpackedSize`
   and `entryCount` recorded in the PR body.
3. The stale `bin` entry is removed from
   `packages/activerecord/package.json:97`, or the directory it names is
   created — whichever is actually intended.
4. Every package still resolves its `main`/`types`/`exports` targets from the
   packed tarball. Verify by installing each packed tarball into a temp dir and
   importing the entrypoint.
5. Sweep the remaining `packages/*` for the same missing-`files` defect and fix
   any others found in the same PR (mechanical, same change).
