---
title: "Cover the deferred load-error re-raise on the has_one create path"
status: draft
updated: 2026-07-25
rfc: "0068-awaitable-has-one-setter"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5324 ported `replace`'s leading `load_target` into
`HasOneAssociation#_createRecord`
(`packages/activerecord/src/associations/has-one-association.ts`,
`loadDisplacedTargetForCreate`). The pre-load must run BEFORE
`super._createRecord`, but Rails reaches `load_target` only AFTER
`build_record` (`singular_association.rb:63-68`), so the helper returns
`[displaced, loadError]` and `_createRecord` re-raises `loadError` only once
the build/save has succeeded.

Two branches, one untested:

- build fails → build error wins, load error discarded. COVERED by the existing
  `create with inexistent foreign key failing` test (that load throws a
  `SqliteError` for the unknown column, so this branch really is exercised).
- build succeeds → `loadError` is re-raised out of `create#{name}`. NOT COVERED.
  Reasoned from Rails source only; nothing pins it, so a future refactor could
  drop the re-raise and every suite would stay green.

## Acceptance criteria

- [ ] A test injects a load failure that is NOT a build-time failure (e.g. stub
      `loadTargetForBuild` / the association's target query to reject with a
      non-`RecordNotFound` error) on a has_one whose owner is persisted and
      whose target is unloaded, and asserts `create#{name}` rejects with that
      error rather than resolving.
- [ ] The test must fail if the `if (loadError) throw loadError;` line in
      `_createRecord` is removed.
- [ ] Lives in `has-one-associations.trails.test.ts` (TS-only guard, no Rails
      counterpart) or beside the sibling deviation guards in
      `has-one-associations.test.ts`, consistent with how the RFC 0068
      deviation guards are already placed.
- [ ] has_one / has_one_through suites stay green.
