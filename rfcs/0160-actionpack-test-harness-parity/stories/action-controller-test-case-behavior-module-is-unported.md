---
title: "ActionController::TestCase::Behavior is unported: its methods sit in the TestCase class body"
status: draft
updated: 2026-10-01
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: []
deps:
  - active-support-test-case-carries-setup-and-teardown-instance-side
deps-rfc: []
est-loc: 650
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split out of `active-support-test-case-carries-setup-and-teardown-instance-side`, whose
last acceptance criterion it is. That story moved the setup/teardown lifecycle onto
`ActiveSupport::TestCase` and deleted the duplicated hooks from
`ActionController::TestCase`. Extracting `Behavior` is a move of the whole class body
(about 400 lines), which did not fit that PR's LOC ceiling beside the lifecycle change.

Rails' `ActionController::TestCase` is nearly empty
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/test_case.rb:368-697`):

```ruby
class TestCase < ActiveSupport::TestCase
  singleton_class.attr_accessor :executor_around_each_request

  module Behavior
    extend ActiveSupport::Concern
    include ActionDispatch::TestProcess
    include ActiveSupport::Testing::ConstantLookup
    include Rails::Dom::Testing::Assertions

    attr_reader :response, :request

    module ClassMethods            # tests, controller_class=, controller_class,
    end                            # determine_default_controller_class (:377-411)

    # get / post / patch / put / delete / head / process / controller_class_name /
    # generated_path / query_parameter_names / setup_controller_request_and_response /
    # build_response (:413-630)

    included do
      include ActionController::TemplateAssertions
      include ActionDispatch::Assertions
      class_attribute :_controller_class
      setup :setup_controller_request_and_response
      ActiveSupport.run_load_hooks(:action_controller_test_case, self)
    end

    private                        # setup_request, wrap_execution,
                                   # process_controller_response, scrub_env!,
                                   # document_root_element, check_required_ivars (:640-693)
  end

  include Behavior
end
```

trails has no `Behavior`. Everything above sits in the `TestCase` class body in
`packages/actionpack/src/action-controller/test-case.ts`:

- the four `ClassMethods` are class statics (`tests`, the `controllerClass` accessor pair,
  `determineDefaultControllerClass`);
- the instance methods and the six private ones are class-body members;
- the `included do` block is module-scope code after the class:
  `include(TestCase, TestProcess)`, the `proto.assertResponse = …` assignments,
  `TestCase.setup(":setupControllerRequestAndResponse")` and
  `runLoadHooks("action_controller_test_case", TestCase)`;
- `classAttribute.call(this, "_controllerClass")` is in a `static {}` block.

`ActionView::TestCase::Behavior` and `ActionDispatch::IntegrationTest::Behavior`
(`action_dispatch/testing/integration.rb:659-700`) have the same shape, so a test class
that is not an `ActionController::TestCase` can `include ActionController::TestCase::Behavior`
in Rails and cannot in trails.

`ActiveRecord::TestFixtures` (`packages/activerecord/src/test-fixtures.ts`, trails PR 8355)
is the settled shape for a Concern with an `included do` block and `ClassMethods`: a live
`Module` extended with `Concern`, instance methods as top-level `this`-typed functions
installed with `moduleEval`.

## Acceptance criteria

- `Behavior` is exported from `action-controller/test-case.ts` as a live `Module` extended
  with `ActiveSupport::Concern`, and `TestCase` is `include(TestCase, Behavior)` at
  `test_case.rb:696`.
- `Behavior.ClassMethods` holds `tests`, `controllerClass` / its writer and
  `determineDefaultControllerClass`; they are no longer `TestCase` statics.
- The `included do` block (`test_case.rb:632-638`) holds the two `include`s, the
  `class_attribute :_controller_class`, the `setup` registration and the load hook, in
  Rails' order.
- Every instance method of `test_case.rb:413-693` is a member of `Behavior`, in Rails'
  order, and the `TestCase` class body holds only `executor_around_each_request`.
- `include(ActionControllerTestCase, SharedRoutes)`
  (`packages/actionpack/src/test-helpers/abstract-unit.ts`) still runs before the
  inherited `beforeSetup`, and trailties' `test_help` `before_setup` reopening
  (`packages/trailties/src/test-help.ts`) still reaches `super`.
- `pnpm parity:api --package actioncontroller` holds `test_case.rb`'s count;
  `parity:api:calls`, `:calls:args`, `:extra:gate` and `:pins` stay green.
- Every actionpack, actionview and trailties test file stays green.
