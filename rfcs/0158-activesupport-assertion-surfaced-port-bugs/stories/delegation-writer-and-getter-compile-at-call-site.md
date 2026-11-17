---
title: "delegate: writer and getter arms also compile at the delegate call site"
status: draft
updated: 2026-11-17
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10219 compiles a delegated _method_ at the `delegate` call site. `Delegation._compileAtCallSite` in `packages/activesupport/lib/delegation.ts` is a `new Function` trampoline padded to `line` with a `sourceURL` of the caller's file. That mirrors `owner.module_eval(method_def.join(";"), file, line)` (`vendor/rails/v8.0.2/activesupport/lib/active_support/delegation.rb:146`), which compiles every generated method there.

The writer arm (`method=`) and the getter arm (a delegated accessor, `descriptor?.get`) in `generate` are still plain closures. A raise through them has its frame in `delegation.ts`, not at the `delegate` line.

## Converged shape

The writer and getter functions go through `_compileAtCallSite` too, so every generated member carries the `file:line` frame Rails' `module_eval` gives it.

## Acceptance criteria

- A raise through a delegated writer or delegated getter carries a `file:line` frame at the `delegate` call. Add a trails test beside `delegation exception backtrace`.
