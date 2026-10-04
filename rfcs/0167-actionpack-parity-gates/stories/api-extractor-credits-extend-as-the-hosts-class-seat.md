---
title: "api extractor credits extend(Host, Mod) as the host's class seat; Helpers extends Resolution through extend()"
status: draft
updated: 2026-10-04
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: []
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

`scripts/api-compare/extract-ts-api.ts`'s `extend` pass (the
`forEachCallNamed(sourceFile, "extend", …)` block) pushes the extended module's
methods onto `hostInfo.instanceMethods` with no `isStatic`, and returns early
unless the host is a class declaration. `extend(Host, Mod)` is Ruby
`extend Mod`: the methods land on the host's singleton.

`compare.ts` needs a stated class seat when Rails declares a name at both
levels (`tsDeclaresOnLevel`, the `bothLevels` arm of the direct match). So a
module that both defines a mixin and extends it onto itself cannot be scored
through `extend()`:
`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/helpers.rb:32-62`
defines `Resolution` and then `extend Resolution` on `Helpers`, giving
`Resolution#modules_for_helpers` and `Helpers.modules_for_helpers`.

trails#8498 therefore spells `extend Resolution` as three statics on `Helpers`
(`static modulesForHelpers = Resolution.modulesForHelpers`, `allHelpersFromPath`,
`helperModulesFromPaths` in
`packages/actionpack/src/abstract-controller/helpers.ts`). That is debt from
the gate, not a shape to keep.

## Acceptance criteria

- The extractor records methods a top-level `extend(Host, Mod)` installs as the
  host's class seat, for a class host and for an exported const object host.
- `Helpers` in `abstract-controller/helpers.ts` is `extend(Helpers, Resolution)`
  with no hand-assigned statics, and `pnpm parity:api --package
abstractcontroller` still reports `helpers.rb` at 100%.
- No other package's `parity:api` matched count drops.
