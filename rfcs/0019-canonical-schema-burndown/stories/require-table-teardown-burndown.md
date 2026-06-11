---
title: "Burn down the require-table-teardown exclude list (18 files, 3 dropAllTables)"
status: claimed
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 200
priority: 6
pr: null
claim: "2026-06-11T20:55:16Z"
assignee: "require-table-teardown-burndown"
blocked-by: null
---

## Context

Sibling ratchet to `require-canonical-schema`. The
`blazetrails/require-table-teardown` ESLint rule (added in #3123,
`eslint/require-table-teardown.mjs`) requires every AR test that creates a table
to tear it down, and grandfathers **18 files** in
`eslint/require-table-teardown-exclude.json`. This story burns that list to zero.

A file leaks tables when it `create_table`s (or `defineSchema`s a non-canonical
table) without a matching teardown — the root cause of shared-worker-DB
collisions. 3 of the 18 currently lean on a broad `dropAllTables` in
`afterAll`; prefer per-table teardown (or riding the canonical schema, which
needs no teardown) over the blunt `dropAllTables` where practical.

## Acceptance criteria

- [ ] For each of the 18 files: add explicit per-table teardown, OR convert the
      file to ride `TEST_SCHEMA` (canonical tables need no teardown), then remove
      it from `require-table-teardown-exclude.json`.
- [ ] The 3 `dropAllTables` users: keep `dropAllTables` only where a file
      genuinely owns many short-lived tables; otherwise narrow to per-table
      teardown.
- [ ] `pnpm lint` shows zero `require-table-teardown` errors; no file-level
      `eslint-disable`.
- [ ] `pnpm vitest run <each touched file>` passes; co-run prior collision
      siblings under `maxForks=1`.

## Notes

- Overlaps with `require-table-teardown-ratchet-burndown` (draft) — they target
  the same 18-file list. This `ready` story is the owner; the draft should be
  closed as a duplicate (do not work both).

## Definition of done

`require-table-teardown-exclude.json` is empty (or only genuinely-justified
entries remain, each with a one-line reason). No file-level disables.
