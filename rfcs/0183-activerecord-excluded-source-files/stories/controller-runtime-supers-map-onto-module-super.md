---
title: "activerecord: ControllerRuntime reaches super through Module#superMethod, not a captured-supers WeakMap"
status: ready
updated: 2026-10-06
rfc: "0183-activerecord-excluded-source-files"
cluster: null
packages: []
deps:
  - rescue-and-instrumentation-process-action-chain-through-super
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

`ActiveRecord::Railties::ControllerRuntime`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/railties/controller_runtime.rb:8-63`) is a Concern whose
`process_action`, `cleanup_view_runtime`, `append_info_to_payload` and `ClassMethods#log_process_action` each call
`super`, reaching `ActionController::Instrumentation`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/instrumentation.rb`) through the ancestry.

trails' port (`packages/activerecord/src/trailties/controller-runtime.ts`) cannot: `ActionController::Base` carries
those four as own prototype / static members, so an included `Module` link sits above them and never overrides. The
port instead captures the previous members in a module-private `supers` WeakMap from a `static [included]` hook Rails
does not have (the module has no `included do` block), reads them through `superOf`, and overwrites the class's own
members. `[included]` carries `@noRailsEquivalent CONVERGEABLE` pointing at this story.

Probe (trails#8580 session): `include(Root, new Module(m => m.defineMethod("pa", ...)))` does not override a `pa`
defined in `Root`'s own class body, which is Ruby's rule too. Rails works because the four methods live on the
`Instrumentation` module, not on `Base`.

`ClassMethods` is likewise ported as a bare exported `logProcessAction` assigned onto the class, not a `ClassMethods`
`Module` handed over by `Concern`.

## Acceptance criteria

- [ ] `ControllerRuntime` is a live `Module` extended with `Concern`, its methods installed with `defineMethod` and
      calling `ControllerRuntime.superMethod(this, "...")` where Rails calls `super` (the shape
      `packages/actionpack/src/action-controller/metal/live.ts` uses), with a `ClassMethods` `Module`.
- [ ] `supers`, `superOf` and the `static [included]` hook are deleted, with the `@noRailsEquivalent` receipt.
- [ ] `initialize` stays the `[initialize]` hook and `attr_internal :db_runtime` stays `attrInternal`.
- [ ] `packages/trailties/src/trailties/active-record.ts`'s `active_record.log_runtime` initializer is unchanged
      (`include(base, ControllerRuntime)`), and `controller-runtime.trails.test.ts` stays green.
