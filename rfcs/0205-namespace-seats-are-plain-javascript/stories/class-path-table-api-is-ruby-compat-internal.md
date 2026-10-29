---
title: "Lint: class-path table API is ruby-compat internal"
status: draft
updated: 2026-10-29
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

CLAUDE.md § "Constant lookup is an import or a registry" (trails#9424): class-path tables are ruby-compat internals answering class → Ruby name only. Outside ruby-compat only the generated `class-paths*.generated.ts` files may call `registerClassPaths`, and no hand-written code calls `generatedClass` / `generatedClassPath` or reads `classpaths`. Two violations today:

- `packages/activesupport/src/inflector.ts:210` — `constantize` falls back to `generatedClass(key)` (name → class).
- `packages/actionpack/src/action-controller/metal/strong-parameters.ts:1047` — hand-written `registerClassPaths([[() => Parameters, "ActionController::Parameters"]])`; Rails defines the class at `vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/strong_parameters.rb:160`. Related: `parameters-yaml-hook-reads-its-class-path-at-module-eval`.

## Acceptance criteria

- [ ] An ESLint rule reports those four names imported from `@blazetrails/ruby-compat` outside `packages/ruby-compat/`, exempting `**/class-paths*.generated.ts`.
- [ ] `inflector.ts` stops calling `generatedClass`; the `Parameters` row moves into actionpack's generated table.
