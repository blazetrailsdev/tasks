---
title: "CI gate rejects reintroduced legacy compare-script spellings"
status: done
updated: 2026-08-10
rfc: "0092-parity-tools-consolidation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6338
claim: "2026-08-10T14:33:26Z"
assignee: "date-seat-drops-nth-and-spells-the-residue-year"
blocked-by: null
closed-reason: null
---

## Context

`retire-legacy-compare-script-aliases` (#6305) renamed every in-repo reference to
the legacy compare-script names onto `parity:*`, and the aliases in the root
`package.json` are now a deprecated shim kept only so out-of-repo callers keep
working (deletion is `delete-legacy-compare-script-aliases`).

Nothing stops the old spellings coming back, and they demonstrably do. Over the
three days #6305 was open, sibling PRs merged into `main` added SEVEN fresh
references that the rebase sweeps had to catch by hand:

- `scripts/api-compare/call-args.ts:1` (`api:compare`, `api:calls`)
- `scripts/api-compare/report-call-args.ts:78` (`pnpm api:compare --calls`)
- `scripts/api-compare/compare.ts:847` (`api:calls`)
- `packages/date/src/test-switch-hitter.test.ts:5,6` (`api:compare`,
  `test:compare`)
- `packages/date/src/test-date-attr.test.ts:5,7` (same pair)
- `packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:2585`
  (`api:calls`)
- `packages/activerecord/src/connection-adapters/postgresql-adapter.ts:1605`
  (`api:compare`)

Each was invisible until the next `git rebase origin/main` + manual grep. Once
`delete-legacy-compare-script-aliases` lands, a reintroduced spelling stops being
a stale doc and becomes a broken command in a comment someone will copy-paste.

## Acceptance criteria

- A gate fails on any legacy compare-script spelling outside the sanctioned
  exceptions. A repo-wide grep step in the `Rails API/Test Comparison` job (or a
  small script under `scripts/parity/`, tested like its siblings) is enough — no
  new dependency.
- Population: the whole tree except `vendor/rails/**` (upstream Ruby) and
  `node_modules/**` / `dist/**`. Note `vendor/{README.md,fetch.ts,sources.ts}`
  ARE in scope — the first sweep excluded `vendor/` wholesale and missed them,
  which is what the #6305 review caught.
- Allowlist exactly the three intentional mentions and nothing more: the
  deprecation notes in `CLAUDE.md` and `scripts/parity/README.md:5`, and the
  historical `api:calls:wide` mentions in
  `docs/infrastructure/prism-codegen-spike.md` (a script RFC 0084 deleted, with
  no `parity:*` counterpart).
- Tokens covered: `api:compare`, `api:drift`, `api:extra`, `api:build`,
  `api:reasons`, `api:detached`, `api:calls*`, `api:arity`, `api:inheritance`,
  `api:pins*`, `api:moves`, `api:conventions`, `lint:deps`, `test:compare`,
  `test:assertions:ratchet*`, `test:stubs`, `fixtures:compare`,
  `schema:compare*`. Must not match the `parity:`-prefixed forms, the
  `scripts/api-compare/` / `scripts/test-compare/` directory names, or the alias
  keys in the root `package.json` while the shim still exists.
