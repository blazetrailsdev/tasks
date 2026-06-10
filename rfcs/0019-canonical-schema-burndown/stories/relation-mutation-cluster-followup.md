---
title: "relation/ mutation cluster (cont.) → canonical schema + Rails fixtures"
status: draft
updated: 2026-06-10
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 400
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Continuation of `relation-mutation-cluster`. That story's first PR converted the
three tractable, high-fidelity files (`structural-compatibility.test.ts`,
`mutation.test.ts`, `delegation.test.ts`) onto `TEST_SCHEMA` + canonical
`Post` + `useHandlerFixtures(["posts"])` and removed them from the exclude JSON.

The remaining three files need substantial faithful rewrites and are deferred
here to keep the first PR under the size ceiling:

- `relation/update-all.test.ts` → `relation/update_all_test.rb` — current TS is
  a synthetic schema (`posts { author, views }`) that has no Rails-`schema.rb`
  parity; a faithful port must move onto the Rails models/fixtures
  (`Author`/`Topic`/`Pet`/`Bird`/`Comment` etc.) `update_all_test.rb` actually
  uses, not a fictional `views` column.
- `relation/delete-all.test.ts` → `relation/delete_all_test.rb` — same: rewrite
  on canonical models + fixtures, bodies matched to Rails word-for-word.
- `relation/thenable.test.ts` → (no Rails counterpart) — TS-specific awaitable
  feature. Per RFC §"framework-internal files with no Rails counterpart", the
  bar is steps 1–3 only (ride canonical schema + fixtures, no inline tables).
  The bespoke `thenable_users`/`thenable_posts`/`thenable_comments` tables must
  be replaced with canonical models; the create-and-count assertions must be
  reworked against seeded fixture rows (or file-unique renamed tables added to
  `TEST_SCHEMA` only when parity-justified — likely not, so canonical models).

## Acceptance criteria

- [ ] Each file rides `TEST_SCHEMA` + canonical models + `fixtures`/`name(:label)`
      lookups where Rails does.
- [ ] Each test body matches its Rails counterpart word-for-word (where one
      exists); test names unchanged.
- [ ] `pnpm vitest run` passes; zero `require-canonical-schema` errors; all three
      files removed from `eslint/require-canonical-schema-exclude.json`.
