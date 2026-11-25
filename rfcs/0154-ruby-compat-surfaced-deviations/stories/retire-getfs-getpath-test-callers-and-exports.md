---
title: "retire-getfs-getpath-test-callers-and-exports"
status: draft
updated: 2026-11-25
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `retire-getfs-and-getpath-public-exports`. Once lib callers are
converged (`trailties-reaches-fs-through-file-and-dir`,
`thor-zeitwerk-tsc-vite-reach-fs-through-file-and-dir`), the remaining public
callers are tests: actionview (6 files), activerecord (3), actionpack (3),
activesupport (3: `encrypted-file.test.ts`, `encrypted-file.trails.test.ts`,
`encrypted-configuration.test.ts`), html-sanitizer (1), rack-cache (1), rake (1),
ruby-compat (3, incl. `fs-adapter.test.ts`). Then `getFs` / `getPath` leave
`packages/ruby-compat/lib/index.ts` and the `./fs-adapter` subpath's public
surface with their `@noRailsEquivalent CONVERGEABLE` receipts
(`packages/ruby-compat/lib/fs-adapter.ts:494-499`); ruby-compat's own modules
keep importing them from `./fs-adapter.js`.

## Acceptance criteria

- No package outside ruby-compat imports `getFs` / `getPath`.
- They are no longer public exports; `FsAdapter` / `PathAdapter` types stay.
