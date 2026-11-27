---
title: "generated-app-resolves-types-its-models-import"
status: draft
updated: 2026-11-27
rfc: "0100-package-size-and-publish-shape"
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
closed-reason: null
---

## Context

`packages/activerecord-cli/lib/type-virtualization/type-registry.ts` emits `import("@blazetrails/date").Time` in generated model reader/writer types (`ATTRIBUTE_TYPE_MAP.datetime`, `ATTRIBUTE_CAST_INPUT_MAP.datetime`/`time`, since trails#10792). A generated app's `package.json` (`packages/trailties/lib/generators/trails/app/templates/package.json.tt`) depends on `@blazetrails/trails`, whose `packages/trails/package.json` does not list `@blazetrails/date` (it is only a transitive dep of activesupport). Under pnpm's strict layout an npm-installed app cannot resolve it, and `trails-tsc` fails with TS2307. The README Quickstart works around it by linking `@blazetrails/date` directly (trails#10848).

## Acceptance criteria

- An npm-installed generated app resolves every package the generated types import (`@blazetrails/date`, `@blazetrails/activesupport`, `@blazetrails/ruby-compat`): either `@blazetrails/trails` re-exports/depends so it resolves, or the app generator declares them.
- The README Quickstart's link step no longer special-cases `@blazetrails/date`.
