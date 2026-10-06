---
title: "default_helper_module! raises NameError for a controller class JS named after a lowercase binding"
status: draft
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8571 made `fireInherited`
(`packages/actionpack/src/action-controller/trailties/helpers.ts`) run
`defaultHelperModuleBang` for every non-anonymous controller subclass, as
`AbstractController::Helpers::ClassMethods#inherited` does
(`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/helpers.rb:68-74`).

Rails' `anonymous?` is `name.nil?`
(`activesupport/lib/active_support/core_ext/module/anonymous.rb:27`), and
`klass = Class.new(ActionController::Base)` has no name. JS names a class
expression after the binding it is assigned to, so
`const klass = class extends Base {}` has `name === "klass"` and `isAnonymous`
answers false. `default_helper_module!` (`helpers.rb:239-244`) then calls
`helper("klass")`; `modules_for_helpers` camelizes the prefix
(`helpers.rb:33-45`) and raises `NameError` for `KlassHelper`, while the rescue
tests `missing_name?("klassHelper")`, so the error is re-raised.

The result is a `NameError` at the first construction of any controller class
bound to a lowercase local. Before trails#8571 that code ran. trails#8571
changed the test ports of `Class.new` to build the class through an arrow
function; user code has no such fix.

A name test in `isAnonymous` (`!/^[A-Z]/.test(name)`) was tried in trails#8571
and rejected in review: it is a heuristic with no Rails counterpart, and it
misreads a class legitimately named `_Foo` or `$Foo`.

## Acceptance criteria

- `const klass = class extends Base {}; new klass()` does not raise, with a
  test in `action-controller/base.trails.test.ts`.
- The mechanism is a real anonymity record (a class is named when a constant
  seat names it, as `rb_mod_name` reads the classpath `const_set` gave it,
  `vendor/ruby/v3.3.11/variable.c:122-127`), not a test on the spelling of
  `name`.
- `controllerName` and `ParamsWrapper`'s `anonymous?` arms read the same record.
