---
title: "A registered class answers JS ToString with its Ruby Module#to_s"
status: ready
updated: 2026-10-17
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: 1
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

Each class declares the seat itself, as `static toString(): string { return rbModToS(this); }`, and an ESLint rule keyed on the **filename** puts it there and keeps it there. A runtime install from `registerConstant` / `defineModule` was considered. It is not taken, because a class that never reaches `registerConstant` would silently keep rendering its source, and a seat added at run time is invisible to `parity:api:extra`, typecheck and review.

The rule is `blazetrails/class-to-string-seat` (`eslint/class-to-string-seat.mjs`). It scopes itself the way `rails-file-structure-method-order` does (`eslint/rails-file-structure-method-order.mjs:545-547`). It turns `context.filename` into a repo-relative path and looks it up in a manifest built from `rails-api.json`, so it fires only in a TS file that mirrors a Rails `.rb`. In such a file:

- Every top-level `class` declaration whose name the manifest lists as a Ruby class or module defined in that `.rb` must have a `static toString()` whose body is exactly `return rbModToS(this);`.
- **Autofix:** if the member is missing, insert it as the class's first static member, and add `rbModToS` to the file's `@blazetrails/ruby-compat` import (or add the import). Insert the import as `../object.js` inside `packages/ruby-compat` itself.
- A `static toString` with any other body is reported and not fixed, because a hand-written Ruby `to_s` port (`def self.to_s`) has to be read by a person.
- A class nested in a namespace object, or one assigned with `rbModConstSet`, is found by the class declaration in the file, not by the seat.
- Not enforced in test files, or in a file with a file-level `@noRailsEquivalent` receipt (`hasFileLevelReceipt`, as in `no-js-rendering-in-rails-messages`).

Enrollment is per package, in the rule's `files` list in `eslint.config.mjs`. The list is only-grow. This story enrolls `ruby-compat`, `activesupport` and `activejob`, and runs `pnpm lint --fix` across them. Each further package is enrolled by its own `pnpm lint --fix` sweep, so filing a follow-up story per remaining package is enough. The codegen generator (`scripts/codegen`) emits the member directly, so generated files are clean from the start.

`static toString` is the JS mechanism for Ruby's `Module#to_s`, not invented surface. `toString` goes into the protocol-method `SKIP_GROUPS` handling in `scripts/parity/conventions.ts` (as a JS spelling of `to_s`), so `parity:api:extra` does not count the seat, and adding it does not move any extra-surface mark.

Then:

- `` `${klass}` `` and `String(klass)` render `HelloJob`, as `"#{klass}"` does in Ruby;
- `rbObjAsString(klass)` keeps answering the same string, since its class arm is `rbModToS`;
- `klass.toString()` stops returning source. Any trails code that relies on reading a class's source has to be found and checked first. None is expected.

## Acceptance criteria

- [ ] `eslint/class-to-string-seat.mjs` with a RuleTester suite (`eslint/class-to-string-seat.test.mjs`). It covers: a missing seat in a Rails-mirrored file is reported and autofixed, including the import added and the import merged; a file that mirrors no `.rb` is ignored; a class the manifest does not list for that file is ignored; a wrong-bodied `static toString` is reported with no fix; a test file and a `@noRailsEquivalent` file are ignored.
- [ ] Rule enrolled for `ruby-compat`, `activesupport` and `activejob`, with `pnpm lint --fix` applied there and the enrollment list documented as only-grow.
- [ ] A runtime test covers a named class, a namespaced class (`ActiveJob::Base` → `"ActiveJob::Base"`) and an anonymous class (`#<Class:0x…>`) rendered through `` `${klass}` ``.
- [ ] A test pins that a subclass renders its own name, not its parent's, because the inherited static reads `this`.
- [ ] `toString` is handled as Ruby `to_s` in `scripts/parity/conventions.ts`, and `pnpm parity:api:extra:gate` stays green with no mark raised.
- [ ] The repo has no call site that depends on `Function.prototype.toString` for an enrolled class, checked by grep and noted in the PR.
- [ ] A follow-up story is filed for each package that is not yet enrolled.
- [ ] The codegen generator emits the seat on generated classes, and its interpolation emits native `` `${x ?? ""}` `` for constants and known classes, dropping its `rbObjAsString` arm.
