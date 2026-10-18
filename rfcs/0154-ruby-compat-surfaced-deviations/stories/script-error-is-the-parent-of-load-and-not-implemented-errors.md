---
title: "ScriptError is the parent of LoadError and NotImplementedError"
status: draft
updated: 2026-10-18
rfc: "0154-ruby-compat-surfaced-deviations"
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

MRI's `Init_Exception` defines `ScriptError < Exception` and makes `LoadError`
and `NotImplementedError` its subclasses (`vendor/ruby/v3.3.11/error.c:3331-3346`).
ruby-compat has no `ScriptError`: `packages/ruby-compat/src/load-error.ts` and
`not-implemented-error.ts` extend `Exception` directly. Since trails#9020
registers core exception classes as constants
(`packages/ruby-compat/src/variable.ts`), `constantize("LoadError")` resolves
but `constantize("ScriptError")` does not, and `rescue ScriptError` has no port.

## Acceptance criteria

- `ScriptError extends Exception` exists in ruby-compat and is registered as a
  constant in `Init_Exception` order.
- `LoadError` and `NotImplementedError` extend `ScriptError`.
- A test checks that `constantize("ScriptError")` resolves and that both subclasses are `instanceof ScriptError`.
