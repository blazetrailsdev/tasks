---
title: "rbFSystem err: is honored, as rb_execarg_addopt does"
status: in-progress
updated: 2026-10-30
rfc: "0211-rake-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9497
claim: "2026-10-30T16:17:02Z"
assignee: "capture-subprocess-io-for-rake-sh"
blocked-by: null
closed-reason: null
---

## Context

`rbExecargNew` accepts `err:` through `EXEC_OPTIONS` (`packages/ruby-compat/src/process.ts`), but the `system` adapter in `packages/ruby-compat/src/child-process-adapter.ts` reads only `options.out`, so `err:` is silently ignored. MRI redirects it like `out:` (`check_exec_redirect`, `vendor/ruby/v3.3.11/process.c:2009`).

## Acceptance criteria

- `rbFSystem` and the system adapter honor `err:` with a filename or an IO, sharing `out:`'s arms.
- `IO.pipe` writers receive the child's stderr.
