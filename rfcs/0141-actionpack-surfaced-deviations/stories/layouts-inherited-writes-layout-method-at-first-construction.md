---
title: "layouts-inherited-writes-layout-method-at-first-construction"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
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

`ActionView::Layouts::ClassMethods#inherited`
(`vendor/rails/v8.0.2/actionview/lib/action_view/layouts.rb:214-217`) calls
`klass._write_layout_method` when a controller subclass is defined. trails runs it
from `ActionController::Metal`'s constructor (`fireInherited` in
`packages/actionpack/src/action-controller/metal.ts`), walking from `new.target` up
to `Metal` once per class, guarded by a `WeakSet`. So an implied layout method is
written at a controller's first construction, not at definition.

The Railties::Helpers half of that walker moved to the boot-time controller load in
`packages/trailties/src/application/finisher.ts` (story
port-action-controller-helpers-and-the-inherited-hook); the Layouts half could not
move there, because controllers defined outside `app/controllers` (every actionpack
test controller) also need their layout method.

## Acceptance criteria

- [ ] `_writeLayoutMethod` for a subclass is reached the way CLAUDE.md
      "`inherited` is deferred to own-property memo guards" prescribes (at the
      subclass's first own read of the layout state), not from the constructor.
- [ ] `fireInherited` and its `@noRailsEquivalent CONVERGEABLE` receipt are gone from
      `metal.ts`.
- [ ] `action-controller/controller/layout.test.ts` stays green.
