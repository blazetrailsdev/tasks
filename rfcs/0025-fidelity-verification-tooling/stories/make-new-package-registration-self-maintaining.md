---
title: "New workspace package must not red main on Website or Guides typecheck"
status: draft
updated: 2026-08-17
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Combines two RFC 0025 drafts with one root cause (swept 2026-08-17).

Adding a workspace package requires registering it in lists that no checklist
names and `pnpm typecheck` cannot see, so **main goes red after the package
lands**, on a job the contributing PR did not run. Both instances have fired
at least twice.

### Website vite aliases (three files)

The docs site resolves workspace packages by **vite alias**, not by their
`exports` map. A new package needs a row in all three of
`packages/website/vite.config.ts`, `packages/website/vite.sw.config.ts`,
`packages/website/vitest.config.ts`. Without them the Website job fails at
bundle time:

```text
[commonjs--resolver] Failed to resolve entry for package "@blazetrails/date"
```

Hit by #6139 (`packages/date`). All three files still exist and are still
hand-maintained (verified 2026-08-17).

### guides-typecheck dependency list

`validatePackageCoverage()` (`scripts/guides-typecheck/check.ts:147`, verified
2026-08-17) scans `packages/*/package.json` and hard-fails if any
`@blazetrails/*` package except `@blazetrails/website` is absent from
`scripts/guides-typecheck/package.json` `dependencies`. The list is
hand-maintained, so every new package reds `Guides Code Type Check` on main
until a one-line follow-up lands:

- #5976 — `@blazetrails/i18n`
- #6142 — `@blazetrails/date` (added by #6139); main was red for two
  consecutive runs (`6a7f11521`, `c21797b26`) before the fix

The job is off on PRs by default (`.github/workflows/ci.yml:461-476`), which is
why the miss is only visible post-merge — the same reason the vite aliases bite.

## Converged shape

Both lists are derivable from `packages/*/package.json`. Either generate them
(preferred — a generated file cannot drift) or add one guard that enumerates
every registration point a new package needs and fails in the _contributing_
PR rather than on main.

Registration points known today, for whichever form the fix takes:
`packages/website/vite.config.ts`, `vite.sw.config.ts`, `vitest.config.ts`,
`scripts/guides-typecheck/package.json` dependencies. See also
[[project_new_package_subpath_needs_four_registrations]]-class findings for
subpath registration, which is adjacent but not the same list.

## Acceptance criteria

- Adding a new `packages/<name>` with a `@blazetrails/` name does not red main
  on either the Website job or `Guides Code Type Check` without a further edit.
- If generated: the generator runs in CI and its output is checked in, so drift
  fails a PR rather than main.
- If guarded: the guard runs on PRs (not only on main) and names every missing
  registration point in one message.
- A test covers the regression: a synthetic new package is detected as
  unregistered before the fix and passes after.
