---
title: "yaml-optional-eager-edges-in-activerecord-and-actionview"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6078
claim: "2026-08-04T17:39:59Z"
assignee: "yaml-optional-eager-edges-in-activerecord-and-actionview"
blocked-by: null
closed-reason: null
---

## Context

`yaml` is now an `optionalDependency` of `packages/activesupport`
(story `yaml-is-an-optional-npm-dependency`). Verified blast radius with
`yaml` uninstalled: `import "@blazetrails/activesupport"` and
`import "@blazetrails/activemodel"` still resolve, but the **root imports of
`@blazetrails/activerecord` and `@blazetrails/actionview` do not** — they die
with `ERR_MODULE_NOT_FOUND: Cannot find package 'yaml'`.

Two eager static ESM edges cause it:

- `packages/activerecord/src/base.ts:336` —
  `import { YAMLColumn as _YAMLColumn } from "./coders/yaml-column.js";`, and
  `packages/activerecord/src/attribute-methods/serialization.ts:12` imports it
  for value. `coders/yaml-column.ts:1` imports
  `@blazetrails/activesupport/yaml`.
- `packages/actionview/src/helpers/index.ts:7` —
  `export { debug } from "./debug-helper.js";`, and
  `packages/actionview/src/helpers/debug-helper.ts:2` imports
  `@blazetrails/activesupport/yaml`.

Rails has no such hazard: Psych is stdlib and
`active_record/coders/yaml_column.rb` / `action_view/helpers/debug_helper.rb`
are autoloaded, so naming the constant costs nothing until it is referenced.
In TS the import is evaluated at module load.

The guard test that pins the surviving half is
`scripts/test-deps/yaml-optional-dependency.test.ts`; it deliberately asserts
only the good property (activesupport + activemodel) rather than ratifying
these two edges.

## Acceptance criteria

- With `yaml` uninstalled, `import "@blazetrails/activerecord"` and
  `import "@blazetrails/actionview"` resolve; only the YAML-specific modules
  fail.
- The convergence does not add abstraction Rails lacks and does not change what
  `YAMLColumn` or `debug` do when `yaml` is installed. Prefer removing the
  load-time value edge (the `base.ts` registration idiom already used for
  `Base`, `import type` where only the type is needed) over a lazy wrapper.
- `scripts/test-deps/yaml-optional-dependency.test.ts` is extended to cover the
  `activerecord` and `actionview` roots.
