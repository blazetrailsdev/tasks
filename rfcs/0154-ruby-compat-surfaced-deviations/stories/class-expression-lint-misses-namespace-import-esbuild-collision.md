---
title: "The class-expression shadowing lint misses the namespace-import form, which esbuild still collides"
status: claimed
updated: 2026-11-19
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["actionpack", "rack-session", "activerecord"]
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: "2026-11-19T00:36:53Z"
assignee: "class-expression-lint-misses-namespace-import-esbuild-collision"
blocked-by: null
closed-reason: null
---

## Context

`blazetrails/no-class-expression-shadowing-aliased-import` (#10316) reports a class expression named
like an aliased import's original name. To fix the five instances on main, #10316 kept the inner names and
read the superclass through a namespace import (`class BacktraceCleaner extends ActiveSupport.BacktraceCleaner`
in `actionpack/lib/action-dispatch/routing/mapper.ts`, and likewise `ConnectionAdapters.ReferenceDefinition`
and `Session.SessionId`). esbuild flattens a namespace member read to the exported binding, so the
bundle still emits `class BacktraceCleaner extends BacktraceCleaner` and throws
`ReferenceError: Cannot access 'BacktraceCleaner' before initialization` at load. This was reproduced with
`examples/serverless-lambda` (trails#10314), which drops the three inner names instead. At run time,
NamedEvaluation still names each class after its static field, and `extract-ts-api.ts`
`staticClassExpressions` credits it by that name.

## Acceptance criteria

- The rule also reports a class expression whose name equals the member name of a namespace-import read in
  its heritage clause (`class X extends NS.X`), and a bare `extends X` where `X` is imported under the same
  name. In both, esbuild's flattened binding collides with the inner name.
- The rule's message names the fix that survives bundling: an anonymous class expression on the static field.
- RuleTester cases for the namespace form. The rule reports zero instances on main.
- The two other instances #10316 fixed are checked with an esbuild bundle and fixed the same way if they
  collide.
