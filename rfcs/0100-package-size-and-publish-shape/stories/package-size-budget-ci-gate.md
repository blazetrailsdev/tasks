---
title: "Package-size and bundle-size budget CI gate"
status: draft
updated: 2026-08-11
rfc: "0100-package-size-and-publish-shape"
cluster: null
packages: ["activerecord"]
deps:
  [
    "exclude-compiled-tests-from-published-dist",
    "stop-publishing-sourcemaps",
    "unpublish-activerecord-test-harness",
    "lazy-adapter-driver-resolution",
    "files-field-for-leaf-packages",
  ]
deps-rfc: []
est-loc: 200
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Every other story in this RFC is a one-time reduction that nothing prevents
from silently growing back. The package reached 28.49 MB / 6,239 files with no
one noticing precisely because there is no gate: a `tsconfig` include, a new
module-scope import, or a missing `files` field each cost megabytes and CI is
green either way.

The regression modes are concrete and already observed:

- an emitted `*.test.js` reappearing in `dist` (the 15.51 MB defect)
- a new module-scope import pulling a subsystem onto the `base.js` path (the
  `pool-config.ts:13` → `DatabaseTasks` defect, 20 KB; the
  `connection-adapters.ts:126-165` → all five drivers defect, ~205 KB)
- a new package landing with no `files` field (the four leaf packages, 1.33 MB)
- a driver becoming statically reachable again, which turns an app's build from
  "works" into "`Could not resolve "pg"`"

Measured baselines to ratchet from (commit `38f55f798`, post-RFC targets in
parentheses): tarball 5,688,149 B (~1.87 MB) · unpacked 29,876,951 B
(7.36 MB) · files 6,239 (842) · bundle 1,904,049 B minified / 540,543 B gzip.

Follow the repo's established ratchet contract (RFC 0047/0084/0095): a checked-in
baseline, only-shrink, a reviewed one-line reason for any row that grows.

## Acceptance criteria

1. A CI job measures, for `@blazetrails/activerecord` and each workspace dep:
   `npm pack` tarball bytes, `unpackedSize`, and `entryCount`; and, for
   activerecord, the esbuild minified + gzipped bundle bytes for
   `import { Base } from "@blazetrails/activerecord"`.
2. The bundle measurement runs with **no `--external` flags and no optional
   drivers installed**, so a driver becoming statically reachable again fails
   CI rather than degrading quietly.
3. Numbers are compared against a checked-in baseline; the gate is only-shrink
   within a stated tolerance, and growth requires an explicit reviewed baseline
   update. No `--write`-style whole-file reseed.
4. The job is cheap enough to run on every PR (it needs a build it can reuse)
   and its runtime is recorded.
5. The baseline is seeded **after** the other stories in this RFC land, so it
   locks in the reduced numbers rather than today's.
