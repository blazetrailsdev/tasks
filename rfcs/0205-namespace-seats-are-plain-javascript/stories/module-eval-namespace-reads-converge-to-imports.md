---
title: "Converge the module-eval namespace-read survivors to plain imports"
status: ready
updated: 2026-10-27
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: conversion
packages: ["activerecord", "actionpack", "activesupport"]
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

The README's "What survives" list keeps a namespace read wherever it runs
during module evaluation. The repo owner wants lookup gone entirely
(2026-10-27), so each survivor needs a plan to become a plain import or to
disappear. The list:

- `packages/activerecord/src/base.ts`: `include(Base, ActiveRecord.Scoping)`
  and `include(Base, ActiveRecord.Associations)`.
- `packages/actionpack/src/action-controller/test-case.ts`:
  `include(Metal, Testing.Functional)`.
- `packages/actionpack/src/action-dispatch/testing/assertions/routing.ts`:
  `class extends ActionDispatch.Integration.Session`.
- `packages/actionpack/src/action-dispatch/http/{mime-negotiation,parameters}.ts`
  and `packages/activesupport/src/message-pack/extensions.ts`: seats onto a
  nested namespace read at module-eval time.
- `extends Migration.Current` (48 files, mostly `*.test.ts` classes defined
  inside a test body, for example `active-record-schema.trails.test.ts:43`,
  `migrator.trails.test.ts:582`). That is a static read of
  `ActiveRecord::Migration::Current` on the imported `Migration` class,
  evaluated when the test runs, not a namespace lookup. Confirm and drop it
  from the list.

Ways to remove a module-eval cycle read, to try in this order per site:

1. Reorder the cycle so the dependency is evaluated first. A plain import
   then works, and the plain-node entry check proves it.
2. Move the `include` into the module's own file, running at the bottom of
   that module after both are evaluated, where Rails' `included` hook
   ordering allows it.
3. Split the module so the read moves inside a function body.

Each site gets the plain-node entry check from CLAUDE.md § "Call-time
constant resolution". `activerecord-reads-whose-import-edge-reorders-the-base-cycle`
already holds the activerecord reads whose import changes the `Base` cycle,
so read it first and do not duplicate it.

## Acceptance criteria

- [ ] Each site above is a plain ES import or is gone, or the PR body shows
      the TDZ trace that all three approaches above hit and files a story
      naming the remaining blocker.
- [ ] The README's "What survives" list is updated to what is left.
- [ ] The built `dist/**.js` of each touched package loads as a plain-node
      ESM entry module, each touched module tried as the entry.
