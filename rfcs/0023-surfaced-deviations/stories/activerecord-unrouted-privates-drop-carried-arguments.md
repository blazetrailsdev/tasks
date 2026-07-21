---
title: "Sweep activerecord for unrouted Rails privates dropping carried arguments"
status: draft
updated: 2026-07-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5025 (story `arel-unrouted-privates-drop-carried-arguments`) swept
`packages/arel/` for ported Rails privates that no internal caller routes
through, on the theory that an unrouted private's _parameters_ are never
exercised and silently rot. It found real bugs: `SelectManager#on` dropped
`collapse` entirely (bare strings raised at visit time), and `Table#join`
skipped both the `EmptyJoinError` check and the `StringJoin` promotion for
`SqlLiteral` relations.

That story's scope note deliberately deferred the same sweep over
`packages/activerecord/`:

> Scope to `packages/arel/` first. If the same pattern shows up in
> activerecord the sweep should be a separate story, not folded into this one.

This is that story. The arel sweep is done; the AR surface is unexamined.

## Method (what worked in arel)

- Start from `scripts/api-compare/call-mismatches-wide-exclude/activerecord/`.
  Its baselined `<method> -> <private>` entries are exactly the
  "declared but not routed" edges. Filter out the `each`/`to_s`/`new`/`first`
  builtin noise first — in arel that was the large majority.
- `scripts/api-compare/conventions.ts` `SKIP_GROUPS` is the other input.
- For each surviving edge, read the vendored Rails body and ask whether the
  private carries arguments (`*extras`, keyword args, block) that the trails
  call site drops. Argument-dropping is the actionable subset.
- Note: "parameterless, therefore low value" was WRONG in arel — two unrouted
  privates (`is_distinct_from`, `collect_ctes`) take only `(node, collector)`
  yet routing them changes emitted SQL. Judge by what routing changes, not by
  the signature.

## Acceptance criteria

- Inventory produced and recorded, even if the actionable set is empty — a
  clean result is a useful outcome.
- Each argument-dropping case fixed and pinned with a test asserting the
  argument reaches the built node, NOT merely that the call returns the right
  node class. That weak assertion is what let the arel cases sit undetected.
- Each new test verified to FAIL on the pre-fix implementation.
- Wide-baseline entries that converge are removed; baseline only shrinks.
  Re-run `API_COMPARE_FORCE=1 pnpm api:compare --wide-calls` before
  `pnpm api:calls:wide` (a stale artifact reports a false OK).
- Split across PRs if it exceeds the LOC ceiling; register the remainder as
  new stories rather than fanning out PRs.
