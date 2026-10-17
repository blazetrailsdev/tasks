---
title: "kernel-module-answers-rand"
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

`rand` is a Kernel module function in MRI (`vendor/ruby/v3.3.11/random.c:1840`
`rb_define_global_function("rand", rb_f_rand, -1)`, `rb_f_rand` at `:1684`),
so `Kernel.rand` is callable and stubbable. ActiveJob's retry jitter calls it
(`vendor/rails/v8.0.2/activejob/lib/active_job/exceptions.rb`
`determine_jitter_for_delay`: `Kernel.rand * delay * jitter`), and
`activejob/test/cases/exceptions_test.rb` stubs it (`Kernel.stub(:rand,
random_amount) { ... }`) in four jitter tests.

ruby-compat ports `rb_f_rand` only as the flat `kernelRand`
(`packages/ruby-compat/src/kernel-rand.ts:33`); its `Kernel` module
(`packages/ruby-compat/src/include.ts:2016`) defines no `rand`, so a faithful
`Kernel.rand()` has nothing to call and a stub of it has nothing to replace.
Surfaced by the Ruby→TS codegen spike, whose shim seats `rand` on `Kernel` as a
workaround.

## Acceptance criteria

- ruby-compat's `Kernel` module answers `rand` (`Kernel.rand(max?)`), backed by
  `rb_f_rand`'s port, so `stub(Kernel, "rand", x, [], block)` replaces it for
  callers that go through `Kernel.rand`.
- `kernelRand` stays the implementation (or is folded in), with its MRI citation.
- ruby-compat tests cover `Kernel.rand()` and stubbing it.
