---
title: "core-exception-classes-are-registered-constants"
status: draft
updated: 2026-10-17
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

MRI defines every core exception class as a top-level constant
(`vendor/ruby/v3.3.11/error.c` `Init_Exception`: `rb_define_class("NotImplementedError", rb_eScriptError)`
and the rest), so `"NotImplementedError".constantize` /
`Object.const_get(:ArgumentError)` resolve. ruby-compat's constant registry
(`packages/ruby-compat/src/variable.ts` `registerConstant`) seats `File`, `Set`,
`Psych` and a few others, but no exception class, so activesupport's
`constantize("NotImplementedError")` raises `NameError: uninitialized constant`.

Surfaced by the codegen spike: activejob's `test/jobs/raising_job.rb`
(`raise error.constantize`) in `test_helper_test.rb`
"perform enqueued jobs properly count job that raises" expects
`NotImplementedError` and gets `NameError`.

## Acceptance criteria

- Each ruby-compat exception class that mirrors an MRI core class
  (`StandardError`, `ArgumentError`, `NotImplementedError`, `NameError`,
  `NoMethodError`, `TypeError`, `RuntimeError`, `KeyError`, `IndexError`,
  `RangeError`, `FrozenError`, …) is registered at its Ruby name where it is
  defined.
- A test that `constantize("NotImplementedError")` answers ruby-compat's class.
