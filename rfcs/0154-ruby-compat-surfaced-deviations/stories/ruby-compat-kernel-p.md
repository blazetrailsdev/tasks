---
title: "Port Kernel#p into ruby-compat and use it in Thor's invoke fixture"
status: draft
updated: 2026-10-29
rfc: "0154-ruby-compat-surfaced-deviations"
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

ruby-compat has no `Kernel#p` (`rb_p_m`, `vendor/ruby/v3.3.11/io.c` — writes `obj.inspect` + newline to `$stdout` for each argument, returns the argument / array / nil). Thor's `spec/fixtures/invoke.thor` (`vendor/thor/v1.3.2/spec/fixtures/invoke.thor:5,12,19,25,66-75,86,95`) calls `p 1` etc.; trails#9465 inlined each as `puts.call($stdout, rbInspect(n))` in `packages/thor/src/test-helpers/fixtures/invoke.ts` (9 sites).

## Acceptance criteria

- [ ] ruby-compat exports `p` mirroring `rb_p_m` (variadic, returns per MRI), with an MRI citation.
- [ ] The 9 inlined sites in `packages/thor/src/test-helpers/fixtures/invoke.ts` call `p(n)`.
