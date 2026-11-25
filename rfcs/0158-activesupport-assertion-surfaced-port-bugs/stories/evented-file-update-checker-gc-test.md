---
title: "evented-file-update-checker-gc-test"
status: draft
updated: 2026-11-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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

# activesupport: port EventedFileUpdateChecker "can be garbage collected"

## Context

`vendor/rails/v8.0.5.2/activesupport/test/evented_file_update_checker_test.rb:103-120` builds a checker on a separate thread, drops it, runs `GC.start`, and asserts the checker's WeakRef is dead and the listener's threads are gone. trails registers the finalizer through `ObjectSpace.defineFinalizer` (`packages/activesupport/lib/evented-file-update-checker.ts`, `EventedFileUpdateChecker.new`), so the finalizer path exists. The test needs a forced collection, and the one sanctioned way in the repo is `setFlagsFromString("--expose-gc")` + `runInNewContext("gc")` (`packages/rack-test/test/uploaded-file.test.ts:27-35`), which imports `node:v8` / `node:vm`. trails#10735 parked the test as `it.skip` because its task barred `node:*` imports.

## Acceptance criteria

- [ ] `it("can be garbage collected")` in `packages/activesupport/test/evented-file-update-checker.test.ts` runs: the checker's `WeakRef` derefs to `undefined` after a forced GC, and the Core's listener is stopped (the finalizer ran `stop`).
- [ ] The forced-GC helper follows `uploaded-file.test.ts`'s shape, or a shared test-support helper if one exists by then.
