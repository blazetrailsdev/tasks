---
title: "Spell check_if_method_has_arguments!'s __callee__ as a colon string"
status: done
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6494
claim: "2026-08-13T21:27:10Z"
assignee: "drop-assert-valid-keys-set-for-rails-include"
blocked-by: null
closed-reason: null
---

## Context

`Relation#checkIfMethodHasArgumentsBang` still takes `methodName: string | symbol`
and unwraps a JS `Symbol` via `.description`
(`packages/activerecord/src/relation.ts:5517-5525`), with
`packages/activerecord/src/relation/build-arel-helpers.test.ts:59` passing
`Symbol("select")`. That is a JS `Symbol` modelling a Ruby Symbol, which
CLAUDE.md forbids; PR #6478 converged the rest of the query-methods surface to
the colon-string model but left this one because it is a method _name_
(`__callee__`), not a query argument.

Rails: `activerecord/lib/active_record/relation/query_methods.rb:1907-1913`
(`check_if_method_has_arguments!(method_name, args, message = ...)`), called as
`check_if_method_has_arguments!(__callee__, fields)` — `__callee__` is a Symbol,
and the message interpolates `method_name` into `.#{method_name}()`.

## Converged shape

`methodName: string`, spelled `":select"` at the call sites that model
`__callee__`, with `.slice(1)` for the name that lands in the error message. The
`<anonymous>` fallback (a description-less JS Symbol) disappears with the JS
`Symbol` — Ruby has no anonymous `__callee__`.

## Acceptance criteria

- [ ] `checkIfMethodHasArgumentsBang` takes a string; no JS `Symbol` arm.
- [ ] The error message is unchanged for every existing caller.
- [ ] `build-arel-helpers.test.ts` passes with `":select"` in place of
      `Symbol("select")`.
