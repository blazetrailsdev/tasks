---
title: "parity:api:extra red on main via stale base.ts equals tag; gate not run in CI"
status: closed
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Premise gone on both halves. (1) The stale @noRailsEquivalent tag on base.ts's `equals` no longer exists: `git grep -n noRailsEquivalent origin/main -- packages/activerecord/src/base.ts` returns only three PERMANENT tags (lines 2589, 4577, 4592) and `git grep -n 'equals(' origin/main -- packages/activerecord/src/base.ts` returns nothing — the declaration and its tag are both gone, and a fresh 'pnpm build && pnpm parity:api && pnpm parity:api:extra --package activerecord' on origin/main (0394f52da) reports base.ts at 6 novel with no STALE gate failure. (2) The remaining deliverable — wiring parity:api:extra into the CI rails-comparison job so local and CI gate state cannot diverge — is the entire subject of the sibling story run-extra-surface-gates-in-ci (now ready), which covers gateStale/gateUnclassified/gateFileTagRejections and the manifest/build-cost question in more detail. Nothing unique left here."
---

## Context

Surfaced while verifying CI gates for PR #5937.

`pnpm parity:api:extra` exits 1 on a clean tree:

```text
extra-surface: 1 STALE @noRailsEquivalent tag(s) on methods that no longer flag
as extra surface — ...
  - activerecord  base.ts  equals
```

The tag on `equals` in `packages/activerecord/src/base.ts` no longer flags as
extra surface (Rails gained the method, the file mapping changed, or the
declaration became internal/`_`-prefixed), so the reasoned tag is dead and the
stale-entry enforcement fails.

Two things make this worth a story rather than a drive-by:

1. It is **not** gated in CI — the `rails-comparison` job runs only
   `lint-call-mismatches.ts` and `lint-call-mismatches-wide.ts`, not
   `parity:api:extra`. So `main` is green while the local gate is red, and every agent
   running `pnpm parity:api:extra` locally sees a spurious failure they must reason
   past. That asymmetry is the actual defect.
2. Deleting the tag is a one-line fix, but deciding _why_ it went stale (and
   whether `equals` should now be counted, excluded, or renamed) needs a look at
   `base.ts` against Rails' `ActiveRecord::Core#==`.

## Acceptance criteria

- [ ] The stale `@noRailsEquivalent` tag on `base.ts`'s `equals` is resolved —
      deleted if the method legitimately no longer counts as extra surface, or
      the underlying mapping fixed if it should still flag.
- [ ] `pnpm parity:api:extra` exits 0 on a clean checkout of `main`.
- [ ] Decide and record whether `parity:api:extra` should join the CI
      `rails-comparison` job so local and CI gate state cannot diverge again
      (either wire it in, or note explicitly why it stays local-only).
