---
title: "main-broken-load-schema-thunk-vs-adapter-signature"
status: done
updated: 2026-07-31
rfc: "0061-ci-failures"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5686
claim: "2026-07-30T23:21:17Z"
assignee: "main-broken-load-schema-thunk-vs-adapter-signature"
blocked-by: null
closed-reason: null
---

## Context

`origin/main` (at `374f2670c`) does not type-check. Second instance of the
same sibling-merge pattern in one evening, in the same file pair as
`main-broken-load-adapter-specific-schema-not-exported`:

```text
packages/activerecord/src/support/load-schema-helper-uuid-default.trails.test.ts(63,20)
error TS2345: Argument of type '() => Promise<AbstractAdapter>' is not
assignable to parameter of type 'AbstractAdapter'.
```

- #5676 (`fix(activerecord): route the uuid_default cover through loadSchema`)
  rewrote the test to call `loadSchema(async () => probe as unknown as
AbstractAdapter)` — passing a thunk.
- #5678 (`refactor(activerecord): lay the per-worker canonical schema through
loadCanonicalSchema`) landed `loadSchema(adapter: DatabaseAdapter)`
  (`load-schema-helper.ts:529`) — taking the adapter directly.

Neither PR touched the other's file, so both were green on their own base and
the breakage exists only in the merged result. Observed on PR 5675 after
rebasing onto `374f2670c`; the two files are byte-identical to `main` in that
branch, so the error is wholly inherited.

The recurrence is the real finding: two adjacent breakages in the same helper
within hours means the seam between `loadSchema` / `loadCanonicalSchema` /
`loadAdapterSpecificSchema` and its trails-only cover is being reshaped by
several PRs at once with no serialization.

## Acceptance criteria

- `origin/main` type-checks: `pnpm build` clean on a fresh checkout of `main`.
- The cover calls `loadSchema` with whatever the current signature is, rather
  than being re-patched per-merge.
- Consider whether this cluster of in-flight helper reshaping wants a single
  owning story so the next refactor does not land the third instance.
