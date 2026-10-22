---
title: "Delete include.ts's initialize hook machinery, which no module feeds any more"
status: draft
updated: 2026-10-22
rfc: "0000-ruby-compat-js-first-burndown"
cluster: deletion
packages: ["ruby-compat", "activesupport", "actionpack", "activerecord", "trailties"]
deps: []
deps-rfc: []
est-loc: 350
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0188 ruled that trails has no `initialize` methods: a module's `initialize`
is inlined into the includer's constructor (CLAUDE.md § "A module's
`initialize` is inlined into the constructor"). The machinery that predates the
ruling is still in `packages/ruby-compat/src/include.ts` (trails `637fa04f91`):

- the `initialize` symbol (`:968`) and the `ModuleHooks` member typed on it
  (`:75`);
- the `instanceInitializers` / `prependedInstanceInitializers` registries
  (`:970-974`);
- `initializeIncludedModules` (`:1004`), `trackInstanceInitializer` (`:1050`)
  and `spliceInstanceInitializer` (`:1070`);
- the readers in `Module#include` / `#prepend` (`:536-538`, `:575-577`),
  `rbModAppendFeatures` (`:1730-1739`) and `prepend` (`:2125-2127`);
- the `Initialized<>` type's `[initialize]` arm (`:1637`).

**No module defines the hook.** `rg '\[initialize\]' packages/*/src` outside
ruby-compat finds nothing. `initializeIncludedModules` has 0 source callers;
`ActionController::Metal`, its one caller when RFC 0138's
`initialize-included-modules-reaches-only-metal` measured it, has converted. Its
remaining callers are trails-only tests, reached through the activesupport
re-export (`packages/activesupport/src/index.ts:561`). Each of them runs zero
hooks:

- `packages/trailties/src/thor/shell.trails.test.ts:19`
- `packages/activerecord/src/trailties/controller-runtime.trails.test.ts:35`
- `packages/actionpack/src/action-dispatch/routing/url-for.trails.test.ts:49,66`

ruby-compat's own `include.test.ts` and `delegate.trails.test.ts` test the
machinery directly.

Deleting the machinery makes two RFC 0154 drafts moot:
`module-initialize-hook-takes-no-constructor-args` and
`spliced-initialize-runs-pre-yield-twice-and-skips-ensure`.

## Acceptance criteria

- [ ] The spans listed above are deleted. `initialize` and
      `initializeIncludedModules` leave `ruby-compat/src/index.ts` and the
      activesupport re-export.
- [ ] The three trails-only tests drop the call and pass unchanged otherwise.
      Run each file: `pnpm vitest run <file>`.
- [ ] ruby-compat's tests that exercise only the hook are deleted, not
      rewritten.
- [ ] The two 0154 drafts are closed `FALSIFIED:` with a reason naming this
      story's PR. Use `tasks close`, never a hand edit.
- [ ] `pnpm parity:api:inlined`, `parity:api:extra:gate` and
      `parity:modules` are green.
