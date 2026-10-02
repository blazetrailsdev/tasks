---
title: "activemodel: define_model_callbacks sends _define_*_model_callback; macros drop extractMacroOptions"
status: ready
updated: 2026-10-02
rfc: "0173-activemodel-parity-100"
cluster: receipts
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `activemodel-audit-permanent-receipts-root`. `packages/activemodel/src/callbacks.ts`
carries two module-private helpers Rails does not have, each under a `@noRailsEquivalent PERMANENT`
receipt the extractor never reads (a module-private declaration is not surfaced, so
`pnpm parity:api:receipts --package activemodel` lists both as unverifiable):

- `_defineModelCallbackByType` — a name→function table standing in for
  `send("_define_#{type}_model_callback", self, callback)`
  (`vendor/rails/v8.0.2/activemodel/lib/active_model/callbacks.rb:123`). Rails' three
  `_define_*_model_callback` are private methods of the `Callbacks` module (`callbacks.rb:129-155`), so
  `send` finds them on the extending class; trails exports them as free functions, so nothing can
  dispatch by name.
- `extractMacroOptions` — splits the trailing options off `*args`, where Rails' generated macro takes
  `|*args, **options, &block|` (`callbacks.rb:130,137,144`). It hand-rolls the "is the last argument an
  options hash" test, including a guard that a plain object holding functions is a callback object.

Neither is a TypeScript shortcoming: `rbFSend` (ruby-compat `Kernel#send`) dispatches by name once the
three methods live on the `Callbacks` class-method module, and ActiveSupport already ports
`extract_options!` (`extractOptionsBang`, `packages/activesupport/src/hash-utils.ts`).

## Acceptance criteria

- [ ] `_defineBeforeModelCallback` / `_defineAroundModelCallback` / `_defineAfterModelCallback` are members of the module `extend`ed onto the host, and `defineModelCallbacks` reaches them with `rbFSend(this, "_define_…_model_callback", this, callback)`; `_defineModelCallbackByType` is deleted.
- [ ] The generated macros take their options through the settled kwargs idiom; `extractMacroOptions` is deleted.
- [ ] `pnpm parity:api:calls` green; `packages/activemodel/src/callbacks.test.ts` green.

## Verification

```bash
pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm vitest run packages/activemodel/src/callbacks.test.ts
```
