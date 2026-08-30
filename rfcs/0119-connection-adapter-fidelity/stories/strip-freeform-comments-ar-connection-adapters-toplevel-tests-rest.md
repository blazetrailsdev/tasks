---
title: "strip-freeform-comments-ar-connection-adapters-toplevel-tests-rest"
status: closed
updated: 2026-08-30
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Done: the connection-adapters `ignores` array is gone from eslint.config.mjs (packages/activerecord is not in the no-freeform-comments exclusion list at eslint.config.mjs:840-862), and running the rule with {report:true} over all three named files — schema-cache.test.ts, postgresql-adapter.exec-query.trails.test.ts, postgresql-adapter.get-client.trails.test.ts — reports zero findings."
---

## Context

Follow-up slice of `strip-freeform-comments-ar-connection-adapters-toplevel-tests`.
That story swept the top-level `*.test.ts` files in
`packages/activerecord/src/connection-adapters/` — 51 files, ~645 deleted lines,
which filled the PR ceiling on its own. Three files were held back and remain
listed in the `ignores` of the `no-freeform-comments` block for
`packages/activerecord/src/connection-adapters/*.ts` in `eslint.config.mjs`:

- `schema-cache.test.ts` (37 findings, ~81 LOC)
- `postgresql-adapter.exec-query.trails.test.ts` (19 findings, ~64 LOC)
- `postgresql-adapter.get-client.trails.test.ts` (17 findings, ~46 LOC)

Measure with `pnpm exec eslint '<file>' --rule
'{"blazetrails/no-freeform-comments":["warn",{"report":true}]}'`. Autofix with
the same rule WITHOUT `{report:true}` — the `report` option suppresses the fix.

The bar: a comment that restates the line or branch it sits on goes. What
survives, survives as JSDoc carrying a tag or a Rails citation. Rails' OWN
comments are deleted too. Deferred work becomes a story.

## Acceptance criteria

- [ ] `pnpm eslint --fix` applied to the three files and the deletions reviewed.
- [ ] The whole `ignores` array removed from the connection-adapters top-level
      `no-freeform-comments` block in `eslint.config.mjs`, along with the
      sentence in its header comment about the outstanding files.
- [ ] `pnpm eslint` clean over the whole top-level directory; a second `--fix`
      is a no-op.
- [ ] `pnpm typecheck` clean; the three test files run green.
- [ ] Deferred work found in a deleted comment is filed as its own story.
