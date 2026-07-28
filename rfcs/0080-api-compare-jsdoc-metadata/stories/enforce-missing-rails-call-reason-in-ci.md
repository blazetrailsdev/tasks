---
title: "Enforce the @missingRailsCall empty-reason contract in a CI job"
status: in-progress
updated: 2026-07-28
rfc: "0080-api-compare-jsdoc-metadata"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 5464
claim: "2026-07-27T23:57:37Z"
assignee: "enforce-missing-rails-call-reason-in-ci"
blocked-by: null
closed-reason: null
---

## Context

PR #5460 made an empty `@missingRailsCall` reason a hard error in `parseJsdoc`
(`scripts/api-compare/build.ts`), matching `@noRailsEquivalent`. The contract is
stated in the "Sibling tag" section of
`docs/infrastructure/api-build-stub-generation-plan.md`.

The two tags are NOT enforced equally, though, and the asymmetry is now in the
enforcement path rather than the parser:

- `@noRailsEquivalent` is validated by `noRailsEquivalentReason`
  (`scripts/api-compare/extract-ts-api.ts:1390`), which runs on every
  `api:extra` / `api:compare` invocation — so CI fails on a bare tag.
- `@missingRailsCall` is validated only inside `parseJsdoc`, whose sole caller
  is `reconcileFileText` in `api:build` (`build.ts`). `api:build` is an opt-in
  developer command with no CI job, so a hand-authored bare (or
  whitespace-only) tag can be committed and sit undetected until someone
  happens to run `pnpm api:build --package <pkg>` over that file.

Zero bare tags exist in the tree today (`grep -rn "@missingRailsCall"
packages/*/src --include=*.ts | grep -vc "—"` → 0), so this is drift
prevention, not a live break.

## Acceptance criteria

- A bare or whitespace-only `@missingRailsCall` anywhere under `packages/*/src`
  fails a job that actually runs in CI, without requiring a full `api:build`
  reconcile (which needs the `--wide-calls` artifact and rewrites files).
- Reuses `parseJsdoc`'s existing check and its
  `<tag> needs a reason: <file>:<line> — ...` message shape; no second parser
  and no second copy of the rule.
- Read-only: the check never writes to source files, so it is safe to run in
  the same job as the other api-compare gates.
- The doc's empty-reason bullet records where each tag is enforced, so the
  parser-level contract and the CI-level enforcement stay described together.
