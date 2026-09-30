---
title: "activerecord: port NoTouching.klasses and retire its SKIP_GROUPS entry"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: skips
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SKIP_GROUPS[7]` skips `klasses` because trails' `NoTouching` keeps a `_noTouchingDepth` map instead of
Rails' thread-local array: `NoTouching.klasses` (`vendor/rails/v8.0.2/activerecord/lib/active_record/no_touching.rb:41`) is
`ActiveSupport::IsolatedExecutionState[:active_record_no_touching_classes] ||= []`, read by
`applied_to?` and pushed/popped by `no_touching`. The execution-context store is trails' analogue of
`IsolatedExecutionState`.

## Acceptance criteria

- [ ] `klasses` is ported over `IsolatedExecutionState` with Rails' push/pop discipline, and the depth map is deleted.
- [ ] `SKIP_GROUPS[7]` is deleted; `no_touching.rb` scores 100%; `touch_later_test.rb` / `no_touching` tests green.

## Verification

```bash
pnpm parity:api && pnpm parity:api:pins && pnpm vitest run scripts/parity/conventions.test.ts
```
