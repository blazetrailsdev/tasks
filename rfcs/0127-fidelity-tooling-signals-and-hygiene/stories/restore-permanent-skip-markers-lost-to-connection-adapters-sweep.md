---
title: "Restore PERMANENT-SKIP markers stripped by the connection-adapters sweep"
status: draft
updated: 2026-08-28
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7186 taught `blazetrails/no-freeform-comments` to treat `PERMANENT-SKIP:`
and `BLOCKED:` as tool directives (`DIRECTIVE_RE` in
`eslint/no-freeform-comments.mjs`), because
`scripts/test-compare/normalize-skips.ts:1111` string-matches both inside a skip
call's body to decide the skip is already annotated. Stripping one makes the
skip look unannotated, so the next `normalize-skips.ts` run staples a fresh
auto-categorized annotation onto it — re-adding prose the sweep removed, and
less specific than what was there.

That guard landed one PR too late. The immediately preceding merge,
`bff5f2169` (#7183, "strip freeform comments from connection-adapters top-level
tests", RFC 0119), swept the same tree while the guard did not yet exist and
deleted **7 markers**, which are gone from `origin/main` today:

- `connection-adapters/connection-handler.test.ts` — 5
  (`PERMANENT-SKIP: Ruby-only (see scripts/api-compare/unported-files.ts) — fork`
  ×5)
- `connection-adapters/connection-handlers-multi-db.test.ts` — 1
  (`PERMANENT-SKIP: Ruby-only — relies on real OS threads + Concurrent::CountDownLatch`)
- `connection-adapters/standalone-connection.test.ts` — 1
  (``PERMANENT-SKIP: Rails' `select_all("SELECT 1", async: true)` returns a ...``)

Recover the exact original text with
`git show bff5f2169 -- 'packages/activerecord/src/connection-adapters/*.test.ts' | grep -E '^-.*(PERMANENT-SKIP:|BLOCKED:)'`
and the surrounding context from `git show bff5f2169^:<path>`.

This is a pure restoration: the rule change that prevents a recurrence is
already on main, so re-adding the markers is now lint-stable — verify with
`npx eslint packages/activerecord/src/connection-adapters/`, which must stay
clean and be a no-op under `--fix`.

Check the same way whether any other already-swept tree lost a marker, since
the broad `no-freeform-comments` block ignores `**/*.test.ts` but the
connection-adapters block does not:
`git log -S'PERMANENT-SKIP:' --pickaxe-regex origin/main -- 'packages/**/*.test.ts'`.

## Acceptance criteria

- [ ] The 7 markers deleted by `bff5f2169` are restored verbatim, reason text
      included, on the skip calls they annotated.
- [ ] Any further markers found lost to an earlier sweep are restored too, or
      the search is recorded as finding none.
- [ ] `npx eslint packages/activerecord/src/connection-adapters/` is clean and a
      second `--fix` run is a no-op.
- [ ] The touched test files run green; no test name changed.
