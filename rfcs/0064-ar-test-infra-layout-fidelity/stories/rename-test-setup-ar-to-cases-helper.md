---
title: "Rename test-setup-ar.ts to cases/helper.ts (test/cases/helper.rb)"
status: ready
updated: 2026-07-26
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: ["move-test-helpers-to-support-dir"]
deps-rfc: []
est-loc: 120
priority: 35
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/test-setup-ar.ts` is the trails counterpart of
`vendor/rails/activerecord/test/cases/helper.rb` — it already carries four
`// Mirror Rails activerecord/test/cases/helper.rb:NN` settings (`:29` at
`:39`, `:40` at `:42`, `:42` at `:47`, `:99-102` at `:55-59`). The name
`test-setup-ar.ts` is a trails invention; `helper.rb` is the Rails name.

Spike: `docs/infrastructure/ar-test-setup-cases-helper-layout-audit.md` (PR #5309).
Depends on `move-test-helpers-to-support-dir` landing first.

## Acceptance criteria

- `git mv packages/activerecord/src/test-setup-ar.ts` →
  `packages/activerecord/src/cases/helper.ts`.
- Update `vitest.config.ts:364` (the setupFiles entry) and the boot-order prose
  at `vitest.config.ts:83`; the file must stay the **second** setupFile, after
  `test-setup-worker-db.ts` — it registers the better-sqlite3 driver that
  `test-setup-dy.ts` then needs.
- Update the `eslint.config.mjs:484` glob and `eslint/no-raw-sql.mjs:42`, which
  hardcodes `/(^|\/)test-setup-[^/]*\.ts$/` — a `cases/helper.ts` path no longer
  matches that regex and would start failing `no-raw-sql`.
- Fix the file's own stale header comment (`:3-4`) referring to a sibling
  `test-setup.ts` that no longer exists.
- No behavior change: the same settings, in the same order, at the same point in
  the boot sequence.
