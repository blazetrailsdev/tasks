---
title: "class-paths: answer a reopened Ruby class like a reopened module"
status: ready
updated: 2026-11-21
rfc: "0255-last-mile-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rubyAnswered` in `scripts/api-compare/class-paths.ts` (around the `defined` set, ~line 925) treats a walked export as answered when it is a Ruby **module** that this package reopens, but it does not do the same for a reopened Ruby **class**. Because of this, actiontext's reopen of `class FormBuilder` (`vendor/rails/v8.0.2/actiontext/app/helpers/action_text/tag_helper.rb:92`) cannot be exported from `packages/actiontext/lib/app/helpers/action-text/tag-helper.ts`. If it is exported, `--check --record` lists it under `excluded` as "a new walked export with no Ruby counterpart". trails#10508 left it unexported, so it is asymmetric with the exported `FormHelper` class module.

A naive widening (adding every Ruby class to `defined`) changed the residue for activesupport core_ext, globalid, thor and trailties, so the fix has to be scoped to reopens: classes that a workspace dependency also defines (see `dependencyDefinitions`).

## Acceptance criteria

- [ ] `rubyAnswered` answers a reopened Ruby class the same way it answers a reopened module, using only the classes that `dependencyDefinitions` reports.
- [ ] `FormBuilder` in tag-helper.ts is `export class`, and `pnpm parity:class-paths:check` passes with no change to any other package's residue.
