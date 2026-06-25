---
title: "Converge bespoke accounts test schemas to canonical (firm_id) to remove shared-DB collisions"
status: claimed
updated: 2026-06-25
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 10
pr: null
claim: "2026-06-25T18:07:05Z"
assignee: "converge-bespoke-accounts-test-schemas"
blocked-by: null
---

## Context

The canonical `accounts` table (`test-helpers/test-schema.ts`) is
`firm_id, firm_name, credit_limit, status, updated_at`. Several test files define
a **bespoke `accounts` schema that omits `firm_id`** (inline `defineSchema({ accounts: {…} })`).
Because the shared per-worker DB resets via truncate-only between files, a
firm_id-less `accounts` left by one file drifts the shared table and breaks a
passive sibling — the documented `project_accounts_table_shared_db_flake`:
`finder.test.ts` `find_by`-with-associations fails `no such column: accounts.firm_id`
depending purely on worker scheduling.

Inventory of files with an inline `accounts: {` block missing `firm_id`
(re-derive fresh before starting — `git grep -lE "accounts:\s*\{" 'packages/activerecord/**/*.test.ts'`,
then check each block for `firm_id`):

- `associations/has-one-through-associations.test.ts`
- `autosave.test.ts`
- `associations/association-scope.test.ts`, `associations/belongs-to-associations.test.ts`,
  `modules.test.ts`, `reflection.test.ts`, `relations.test.ts`,
  `strict-loading.test.ts`, `transactions.test.ts`

**Scope split (avoid double-touching files / sibling-PR collisions):** all but two
of those files already have a dedicated full-file canonical-conversion story
(`association-scope-test-canonical`, `assoc-belongs-to`,
`inheritance-modules-reflection-followup`, `relations-test-canonical`,
`strict-loading-canonical-schema`, `transactions-test-canonical`) — they converge
their `accounts` usage there, not here. **This story owns only the two files with
no dedicated conversion story: `has-one-through-associations.test.ts` and
`autosave.test.ts`.** It also serves as the tracking record for the
accounts-collision class.

## Acceptance criteria

- In `associations/has-one-through-associations.test.ts` and `autosave.test.ts`,
  remove the bespoke `accounts` schema block and ride the **canonical** preloaded
  `accounts` table (canonical columns incl. `firm_id`), matched to Rails. Prefer
  `setupHandlerSuite` / `useHandlerFixtures` + `name(:label)` over `defineSchema`.
- Do **not** re-declare `accounts` with a bespoke shape anywhere. If a test needs
  an accounts column with no `schema.rb` analog, add it to the canonical
  `test-schema.ts` only when Rails `schema.rb` has it (parity-check first);
  otherwise it does not belong on `accounts`.
- No shared-name `accounts` drift remains from these two files: a passive sibling
  reading `accounts.firm_id` cannot fail because of them.
- Test names unchanged; `pnpm vitest run` passes for both files on sqlite.
- The other firm_id-less `accounts` definers are left to their own
  `*-test-canonical` stories (cross-referenced above) — do not edit them here.

## Definition of done

The two ownerless firm_id-less `accounts` definers ride canonical `accounts`; the
shared-DB `accounts.firm_id` collision class is eliminated from them. Fidelity is
the deliverable — no bespoke `accounts` shape, no `eslint-disable`.
