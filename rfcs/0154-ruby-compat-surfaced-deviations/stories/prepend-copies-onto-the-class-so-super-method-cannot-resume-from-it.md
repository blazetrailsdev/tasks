---
title: "prepend copies the module onto the class, so superMethod cannot resume from a prepended method"
status: draft
updated: 2026-10-02
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while shipping `active-support-test-case-carries-setup-and-teardown-instance-side` (trails PR 8362).

Ruby's `prepend` inserts the module ahead of the class in the ancestry (`vendor/ruby/v3.3.11/eval.c:1196` `rb_mod_prepend`, `class.c:1430` `rb_prepend_module`). A prepended method's `super` resumes at the class's own method, then at whatever is included beneath the class.

ruby-compat's `prepend` (`packages/ruby-compat/src/include.ts:1185`) and `Module#prependFeatures` (`include.ts:351`) copy the module's descriptors onto `klass.prototype` instead. Nothing is spliced, so:

- the class's own method of that name is overwritten rather than reached by `super`;
- `Module#superMethod` (`include.ts:425`) finds the module's link by identity in `includerCarriers`, and a prepended module has no link, so it answers `undefined`.

That is why `ActiveSupport::TestCase` cannot port `prepend ActiveSupport::Testing::SetupAndTeardown` / `prepend TestsWithoutAssertions` (`vendor/rails/v8.0.2/activesupport/lib/active_support/test_case.rb:145-146`) as modules that call `super`. Its `beforeSetup` / `afterTeardown` (`packages/activesupport/src/test-case.ts:84,95`) reach the next link with `Object.getPrototypeOf(TestCase.prototype).beforeSetup?.call(this)`.

## Converged shape

`prependFeatures` splices a link for the module ABOVE the class's own methods (the class's members move to a link beneath it, or the module's link is recorded so `superMethod` resumes at the class's own member and then beneath the class), and `superMethod` resolves from a prepended module the way it does from an included one.

## Acceptance criteria

- A method of a `Module` prepended onto a class reaches the class's own method of that name through `Mod.superMethod(this, name)`, and then a module included beneath the class.
- A module included onto the class AFTER the prepend is still reached.
- `instanceof` the class and its superclass keeps answering true, and `prepend`'s per-instance `initialize` ordering is unchanged.
- Covered by tests in `packages/ruby-compat/src/include*.test.ts`; every existing `prepend` caller stays green.
