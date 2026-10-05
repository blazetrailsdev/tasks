---
title: "helper_method forwarders dispatch through controller.send, with the property arm receipted"
status: draft
updated: 2026-10-05
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

Rails' `helper_method`
(`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/helpers.rb:128-145`)
emits one forwarder per name, with no per-name branching:

```ruby
def #{method}(...)
  controller.send(:'#{method}', ...)
end
```

trails' `helperMethod`
(`packages/actionpack/src/abstract-controller/helpers.ts`) carries three arms
Rails does not have, none of them receipted:

- a prototype walk for a getter descriptor, defining a get-only property;
- since trails#8543, an attribute arm: a `name=` entry in `_helperMethods`
  makes `name` one accessor property whose `get` and `set` forward to the
  controller (CLAUDE.md, "Generated attribute readers are properties", is why
  the two halves share one descriptor);
- a function arm that throws an invented
  `TypeError("helper_method: controller does not respond to '<name>'")` where
  `controller.send` raises `NoMethodError`.

A field-backed controller attribute registered with plain
`helper_method :name` (no writer) still lands in the function arm and throws
when the view reads it, because the decision is made from the class prototype
at registration time.

The arms report is not gated for actionpack, so none of this reds a gate. The
justification for the attribute arm lives only in trails#8543's PR body.

## Converged shape

Each forwarder dispatches through ruby-compat's `rbFSend(this.controller,
method, ...args)`, the port of `controller.send`: it already resolves a
`name=` writer to the property setter, reads an accessor, and raises
`NoMethodError` for an undefined name. The property-vs-method choice that JS
forces (a view reads `name`, it does not call `name()`) is then the only arm
left, and it carries an `@inventedArm if — PERMANENT` receipt on
`helperMethod` citing CLAUDE.md "Generated attribute readers are properties".

## Acceptance criteria

- `helperMethod`'s forwarders call `rbFSend` on the controller; the invented
  `TypeError` is gone and an undefined name raises `NoMethodError`.
- A field-backed attribute registered with `helperMethod("name")` alone reads
  through the helper.
- The remaining property-vs-method arm is receipted with `@inventedArm` on the
  declaration, and `pnpm parity:api:arms:throws` stays green.
- The existing `abstract-controller/helpers.test.ts` writer-entry cases (both
  orders, lone writer, `==`, `clearHelpers` replay) still pass.
