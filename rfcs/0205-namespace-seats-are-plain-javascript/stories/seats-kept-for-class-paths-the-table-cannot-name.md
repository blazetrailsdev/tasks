---
title: "seats-kept-for-class-paths-the-table-cannot-name"
status: ready
updated: 2026-10-27
rfc: "0205-namespace-seats-are-plain-javascript"
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

`ActionDispatch::MissingController` is defined in `vendor/rails/v8.0.2/actionpack/lib/action_dispatch.rb:50`
(`class MissingController < NameError`), but trails defines it in
`packages/actionpack/src/action-dispatch/http/request.ts`. The generated
class-path table pairs a Ruby class only with the TS file that mirrors its
`.rb`, so it cannot name this class, and its path still comes from
`rbModConstSet(ActionDispatch, "MissingController", MissingController)` at the
bottom of `request.ts` — a seat with no Rails `const_set` behind it, kept by
the actionpack sweep (RFC 0205) only to preserve `rbModName`.

`ActiveSupport::Inflector` has the same leftover for a different reason:
`packages/activesupport/src/inflector.ts` seats the ES module namespace object
(`import * as Inflector from "./inflector.js"`), which a generated table entry
(`mN.Name`) cannot name. `AbstractController::Railties`
(`abstract_controller/railties/routes_helpers.rb`) is exported as `Trailties`
and so has no table path at all.

## Acceptance criteria

- [ ] `MissingController` lives in the TS file that mirrors `action_dispatch.rb`, and its seat is a plain `ActionDispatch.MissingController = MissingController` or gone.
- [ ] `ActiveSupport::Inflector` gets its path without `rbModConstSet` (a table entry the generator can render for a module namespace object, or a plain-object module).
- [ ] `rbModName` answers `ActionDispatch::MissingController` and `ActiveSupport::Inflector` from a deep import, as before.
