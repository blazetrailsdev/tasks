---
title: "A registered class answers JS ToString with its Ruby Module#to_s"
status: draft
updated: 2026-10-17
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

In Ruby, interpolating a class renders its name. `"#{klass}"` calls `Module#to_s`, which is `rb_mod_to_s` (`vendor/ruby/v3.3.11/object.c:1710-1742`). A named class renders `rb_class_name`, so `"#{HelloJob}"` is `"HelloJob"`. Rails messages rely on this. For example, `ActiveJob::LogSubscriber#enqueued_jobs_message` builds `"#{count} #{klass}"` from `job.class` (`vendor/rails/v8.0.2/activejob/lib/active_job/log_subscriber.rb`, `enqueued_jobs_message`).

In JS, a template literal calls `ToString` on its operand. For a class that is `Function.prototype.toString`, which returns the class's **source text**. So a trails port of `"#{klass}"` written as `` `${klass}` `` prints the class body instead of `HelloJob`.

ruby-compat already computes the Ruby rendering: `rbModToS` (`packages/ruby-compat/src/object.ts`, the `rb_mod_to_s` port) answers the registered constant path or `klass.name`, and handles the singleton-class arm. What is missing is a JS seat that routes a class's `ToString` through it. Today every call site must wrap the value in `rbObjAsString` / `rbModToS`. The codegen generator (`scripts/codegen`, branch `codegen-native-inference`) wants to emit native `` `${x}` `` for interpolation, and can do so only for values it can prove are not classes.

## Converged shape

A trails class answers its Ruby `to_s` from JS `ToString`, as `static toString(): string { return rbModToS(this); }`. Install it once, where trails already registers every Ruby constant, rather than at each class:

- `registerConstant` in ruby-compat, which both hand-ported and generated classes call;
- or `defineModule`, for ruby-compat `Module` objects.

Then:

- `` `${klass}` `` and `String(klass)` render `HelloJob`, as `"#{klass}"` does in Ruby;
- `rbObjAsString(klass)` keeps answering the same string, since its class arm is `rbModToS`;

- `klass.toString()` stops returning source. Any trails code that relies on reading a class's source has to be found and checked first. None is expected.

## Acceptance criteria

- [ ] Every class passed to `registerConstant` (and every `defineModule` module) answers `` `${klass}` `` with `rbModToS(klass)`. A test covers a named class, a namespaced class (`ActiveJob::Base` → `"ActiveJob::Base"`) and an anonymous class (`#<Class:0x…>`).
- [ ] A test pins that a subclass registered later renders its own name, not its parent's (the static method reads `this`).

- [ ] The repo has no call site that depends on `Function.prototype.toString` for a registered class, checked by grep and noted in the PR.
- [ ] The codegen generator's interpolation then emits native `` `${x ?? ""}` `` for constants and known classes too, dropping its `rbObjAsString` arm.
