---
title: "suppressor.test.ts → canonical Notification/User (needs save-suppression impl fix)"
status: draft
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 120
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Split out of `misc-core-cluster` (which shipped explain + unsafe-raw-sql in
that PR). `suppressor.test.ts` is still in `require-canonical-schema-exclude.json`.

Port `suppressor.test.ts` to the canonical `Notification` / `User` /
`UserWithNotification` models (`test-helpers/models/notification.ts`,
`.../user.ts`) + `TEST_SCHEMA.notifications` / `TEST_SCHEMA.users`, matching
`vendor/rails/.../suppressor_test.rb` word-for-word.

**Blocker — implementation gap:** Rails' `Suppressor` overrides `save` / `save!`
to return `true` _before_ validation runs. Our suppression short-circuits only
in `_performInsert` / `_performUpdate` (base.ts ~2723/2818), i.e. _after_
validation. So `Notification.create!` (no `message`, which fails presence)
under `suppress` raises `RecordInvalid` in trails but is a silent no-op in
Rails. The faithful `test_suppresses_create` body needs the save path to
short-circuit on `isSuppressed` before validating. Fix that in the save flow
(instance `save` / `saveBang` / `_createOrUpdate`) first, then port the test.

## Acceptance criteria

- [ ] Bodies match `suppressor_test.rb` word-for-word; test names unchanged.
- [ ] Rides `TEST_SCHEMA` + canonical models.
- [ ] `suppress`-before-validation parity fixed; `pnpm vitest run` passes.
- [ ] Removed from `require-canonical-schema-exclude.json`.
