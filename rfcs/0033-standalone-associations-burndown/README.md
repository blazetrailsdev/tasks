---
rfc: "0033-standalone-associations-burndown"
title: "Standalone-association call burndown"
status: active
created: 2026-06-17
updated: 2026-06-17
owner: "@deanmarano"
packages:
  - "activerecord"
clusters: []
related-rfcs:
  - "0025-fidelity-verification-tooling"
---

## Summary

Burn down the ~1,900 standalone `Associations.<macro>.call(Model, …)` sites to
zero, converting each to the in-class `this.<macro>(…)` declaration form (inside
the model's `static {}` block) and ratcheting the
`eslint/no-standalone-associations-exclude.json` baseline down accordingly.

This is the migration the `blazetrails/no-standalone-associations` ESLint rule
(landed in PR #3544) was built to enable. The rule + site-granular baseline are
already in place; only NEW standalone usages fail CI today. This RFC tracks
draining the grandfathered baseline.

## Motivation

The in-class form lets `packages/activerecord/scripts/materialize-model-declares.ts`
materialize the `declare <assoc>: …` accessors so `parent.children` reads
naturally with full types, and keeps association declarations co-located with
the class they belong to (Rails layout fidelity).

## Approach

- Convert in waves, mostly via the rule's autofixer (`eslint --fix`), which
  relocates a `.call` into the target class's `static {}` block when provably
  safe (same-file class, has a static block, declared before the call,
  unambiguous name). Output is prettier-clean.
- For report-only sites (cross-file class, dynamic receiver, ambiguous name,
  non-statement call), move manually.
- After each wave, run the declare generator and drop the converted keys from
  `eslint/no-standalone-associations-exclude.json` (regenerate with
  `pnpm tsx scripts/generate-standalone-associations-exclude.ts`).
- Per-PR scope stays under the 500-LOC ceiling; split by file/cluster.

## Distribution of sites (at rule landing)

hasMany ~1287, belongsTo ~698, hasOne ~197, hasAndBelongsToMany ~32; ~1869
unique site keys baselined; almost all in `packages/activerecord/**/*.test.ts`.

## Done when

`eslint/no-standalone-associations-exclude.json` is empty (or deleted) and the
rule runs clean repo-wide with no grandfathered entries.
