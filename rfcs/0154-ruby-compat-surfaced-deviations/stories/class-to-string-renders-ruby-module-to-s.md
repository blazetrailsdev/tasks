---
title: "A registered class answers JS ToString with its Ruby Module#to_s"
status: done
updated: 2026-10-18
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: 1
pr: trails#9019
claim: "2026-10-18T00:14:54Z"
assignee: "class-to-string-renders-ruby-module-to-s"
blocked-by: null
closed-reason: null
---

## Context

In Ruby, interpolating a class renders its name. `"#{klass}"` calls `Module#to_s`, which is `rb_mod_to_s` (`vendor/ruby/v3.3.11/object.c:1710-1742`). A named class renders `rb_class_name`, so `"#{HelloJob}"` is `"HelloJob"`. Rails messages rely on this. For example, `ActiveJob::LogSubscriber#enqueued_jobs_message` builds `"#{count} #{klass}"` from `job.class` (`vendor/rails/v8.0.2/activejob/lib/active_job/log_subscriber.rb`, `enqueued_jobs_message`).

In JS, a template literal calls `ToString` on its operand. For a class that is `Function.prototype.toString`, which returns the class's **source text**. So a trails port of `"#{klass}"` written as `` `${klass}` `` prints the class body instead of `HelloJob`.

ruby-compat already computes the Ruby rendering: `rbModToS` (`packages/ruby-compat/src/object.ts`, the `rb_mod_to_s` port) answers the registered constant path or `klass.name`, and handles the singleton-class arm. What is missing is a JS seat that routes a class's `ToString` through it. Today every call site must wrap the value in `rbObjAsString` / `rbModToS`. The codegen generator (`scripts/codegen`, branch `codegen-native-inference`) wants to emit native `` `${x}` `` for interpolation, and can do so only for values it can prove are not classes.

## Converged shape

Each class declares its Ruby name as a literal, for example `static toString(): string { return "ActiveJob::Base"; }`. An ESLint rule writes that string from the class's **trails file location** and keeps it in sync. A runtime install from `registerConstant` / `defineModule` was considered and not taken. A class that never reaches `registerConstant` would keep rendering its source without anyone noticing, and a member added at run time can't be seen by typecheck, `parity:api:extra` or review.

The rule is `blazetrails/class-to-string-seat` (`eslint/class-to-string-seat.mjs`). It reads `context.filename` as a repo-relative path, `packages/<pkg>/src/<dir>/<file>.ts`, and turns it into the Ruby constant path:

- The package gives the root namespace: `activejob` → `ActiveJob`, `activesupport` → `ActiveSupport`, and so on.
- Each directory segment is camelized into a namespace.
- The class's own name is appended.

So `packages/activejob/src/base.ts` → `ActiveJob::Base`, and `packages/activerecord/src/connection-adapters/abstract/quoting.ts` → `ActiveRecord::ConnectionAdapters::Quoting`. The mapping is the reverse of the path translation `scripts/parity/conventions.ts` already uses: the package-to-namespace table, the acronym inflections and `PATH_SEGMENT_ALIASES` / `RUBY_FILE_TS_OVERRIDES`. The rule imports those tables and doesn't keep its own copy. In an enrolled file:

- Every exported top-level `class` must have a `static toString()` whose body is exactly `return "<derived name>";`.
- **Autofix:** if the member is missing, insert it as the class's first static member. If the string differs from the derived name, for example after a file moves, rewrite the string.
- A `static toString` with any other body shape is reported and not fixed, because a hand-written Ruby `to_s` port (`def self.to_s`) has to be read by a person.
- Where the trails location does not give the Rails constant path (a namespace Rails has but the directory layout doesn't), the fix is a `RUBY_FILE_TS_OVERRIDES` / `PATH_SEGMENT_ALIASES` entry in `conventions.ts`, never a hand-edited string.
- Not enforced in test files, or in a file with a file-level `@noRailsEquivalent` receipt (`hasFileLevelReceipt`, as in `no-js-rendering-in-rails-messages`).

**Subclasses.** A static method is inherited, so a subclass with no seat of its own renders its parent's literal. Every class in an enrolled file gets its own seat from the rule. Classes outside trails' packages, such as an app's `HelloJob extends ApplicationJob`, are covered by the trailties generators and the codegen generator. Both emit the seat with the name they already know. A subclass written by hand with no seat renders its parent's name, which is a known gap. This story only documents it, for example in a `class-to-string-seat` section of the rule's JSDoc.

Enrollment is per package, in the rule's `files` list in `eslint.config.mjs`. The list is only-grow. This story enrolls `ruby-compat`, `activesupport` and `activejob`, and runs `pnpm lint --fix` across them. Each further package is a follow-up story whose work is its own `lint --fix` sweep.

`static toString` is the JS mechanism for Ruby's `Module#to_s`, not invented surface. `toString` is mapped to Ruby `to_s` in `scripts/parity/conventions.ts`, so `parity:api:extra` doesn't count the seat.

Then:

- `` `${klass}` `` and `String(klass)` render `ActiveJob::Base`, as `"#{klass}"` does in Ruby;
- `rbObjAsString(klass)` / `rbModToS(klass)` must agree with the literal. A test asserts `String(klass) === rbModToS(klass)` for every enrolled class that is registered;
- `klass.toString()` stops returning source. Any trails code that relies on reading a class's source has to be found and checked first. None is expected.

## Acceptance criteria

- [ ] `eslint/class-to-string-seat.mjs` with a RuleTester suite (`eslint/class-to-string-seat.test.mjs`). It covers: a missing seat is autofixed with the name derived from the path (a top-level file, a nested directory, an acronym package such as `ActiveJob`, and a path that goes through a `conventions.ts` alias); a stale string is rewritten; a wrong-bodied `static toString` is reported with no fix; a test file and a `@noRailsEquivalent` file are ignored.
- [ ] The path-to-constant mapping reuses `scripts/parity/conventions.ts` tables, with no duplicated alias list.
- [ ] Rule enrolled for `ruby-compat`, `activesupport` and `activejob`, with `pnpm lint --fix` applied there and the enrollment list documented as only-grow.
- [ ] A runtime test covers a top-level class and a namespaced class (`ActiveJob::Base` → `"ActiveJob::Base"`) through `` `${klass}` ``, and asserts `String(klass) === rbModToS(klass)` for each enrolled registered class.
- [ ] A test pins that a class in an enrolled file that subclasses another enrolled class renders its own name, because its own seat was generated.
- [ ] The trailties job/model generators and the codegen generator emit the seat, and the hand-written-subclass gap is documented.
- [ ] `toString` is handled as Ruby `to_s` in `scripts/parity/conventions.ts`, and `pnpm parity:api:extra:gate` stays green with no mark raised.
- [ ] The repo has no call site that depends on `Function.prototype.toString` for an enrolled class, checked by grep and noted in the PR.
- [ ] A follow-up story is filed for each package that is not yet enrolled.
- [ ] The codegen generator's interpolation emits native `` `${x ?? ""}` `` for constants and known classes, dropping its `rbObjAsString` arm.
