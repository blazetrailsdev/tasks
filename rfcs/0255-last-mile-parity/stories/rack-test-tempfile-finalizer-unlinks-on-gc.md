---
title: "rack-test: UploadedFile's tempfile is unlinked on garbage collection"
status: done
updated: 2026-11-22
rfc: "0255-last-mile-parity"
cluster: small-packages
packages: [rack-test, ruby-compat]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#10536
claim: "2026-11-22T00:07:32Z"
assignee: "actionview-port-atom-feed-helper"
blocked-by: null
closed-reason: null
---

## Context

"removes local paths on garbage collection" is skipped as "JS cannot run a
finalizer on GC". Tempfile registers `define_finalizer`
(`vendor/ruby/v3.3.11/lib/tempfile.rb:299`). A `FinalizationRegistry` plus a
forced `gc()` (`v8.setFlagsFromString("--expose-gc")`) removed the file in
20/20 runs of the spec's shape.

## Acceptance criteria

- [ ] ruby-compat's Tempfile registers its unlink with a `FinalizationRegistry` where Ruby calls `define_finalizer`.
- [ ] The rack-test spec runs and passes, forcing `gc()` the way the spec forces `GC.start`.
- [ ] The truncated `PERMANENT-SKIP:` receipt is removed.

## Verification

```sh
pnpm vitest run packages/rack-test packages/ruby-compat/test/tempfile.trails.test.ts
```
