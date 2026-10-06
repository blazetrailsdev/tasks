---
title: "ActionController::Helpers' all_application_helpers reads the class's helpers_path; helper_method's accessor arm and Fragments' respond_to? converge"
status: draft
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left over after `abstract-controller-helpers-module-and-caching-instance-halves`
moved `_helpers`, `helper` and the `Caching` / `Fragments` concerns onto
ruby-compat's `Module` and `ActiveSupport::Concern`.

- **`all_application_helpers` reads a module-level cache.** Rails'
  `ActionController::Helpers::ClassMethods#all_application_helpers`
  (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/helpers.rb:118-120`)
  is `all_helpers_from_path(helpers_path)`, read from the class attribute at
  call time. trails' `allApplicationHelpers`
  (`packages/actionpack/src/action-controller/metal/helpers.ts`) returns
  `_applicationHelpers`, filled ahead of time by `loadApplicationHelperNames`
  from the module-level `helpersPath()`, because
  `Resolution.allHelpersFromPath` awaits a glob. So a class that changes its own
  `helpersPath` still gets the first scan, and
  `test_all_helpers_with_alternate_helper_dir`
  (`vendor/rails/v8.0.2/actionpack/test/controller/helper_test.rb:210-223`) is
  `it.skip` in `packages/actionpack/src/action-controller/controller/helper.test.ts`.
  `setApplicationHelpers` also `registerConstant`s each helper and never
  unregisters one.
- **`modules_for_helpers`' `args.delete(:all)`**
  (`action_controller/metal/helpers.rb:112-115`) is ported as
  `includes` plus `filter`.
- **`helper_method` keeps an accessor arm.** Rails defines one method per name,
  `def meth(...) = controller.send(:meth, ...)`
  (`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/helpers.rb:126-143`).
  `helperMethod` (`packages/actionpack/src/abstract-controller/helpers.ts`)
  sends through `rbFSend` for a method, but still defines an accessor property
  when the controller member is a getter or a `name=` writer is registered,
  reading and writing `this.controller[attr]` directly. A template reads
  `<%= notice %>` as a property, and `notice` on the controller is a getter
  (`action_controller/metal/flash.rb:36-45`), so dropping the arm renders the
  function source. Decide whether the arm is the reader-as-property rule
  (CLAUDE.md, "Generated attribute readers are properties") and receipt it, or
  converge it.
- **`Fragments.included`'s `respond_to?(:class_attribute)`**
  (`abstract_controller/caching/fragments.rb:25-29`) is still
  `typeof this === "function"`: no trails class answers `classAttribute`,
  which is a free function.

## Acceptance criteria

- `allApplicationHelpers` answers from the receiving class's `helpersPath`, and
  `all helpers with alternate helper dir` runs unskipped.
- `modulesForHelpers` deletes `":all"` from `args` as Rails does.
- `helperMethod`'s accessor arm is either converged onto Rails' one-method body
  or carries a receipt naming the ratified rule.
- `Fragments`' included block asks `rbObjRespondTo(this, "classAttribute")`, or
  the `typeof` test carries a receipt.
