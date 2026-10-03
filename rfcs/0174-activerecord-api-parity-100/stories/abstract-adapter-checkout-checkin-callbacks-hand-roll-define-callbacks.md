---
title: "activerecord: AbstractAdapter hand-rolls checkout/checkin callbacks Rails gets from define_callbacks"
status: draft
updated: 2026-10-03
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:30-33`:

    include ActiveSupport::Callbacks
    define_callbacks :checkout, :checkin

so `_run_checkout_callbacks` / `_run_checkin_callbacks` are the runners `define_callbacks`
generates (`vendor/rails/v8.0.2/activesupport/lib/active_support/callbacks.rb:912-914`), called at
`abstract/connection_pool.rb:582,943`, and `set_callback :checkin, :after, :enlist_in_transaction`
style registrations go through `ActiveSupport::Callbacks`.

`packages/activerecord/src/connection-adapters/abstract-adapter.ts` instead hand-rolls the whole
mechanism: a static `_connectionCallbacks` record of `{ kind, method }` rows, a private
`_runCallbacks(phase, block)` loop, and hand-written `_runCheckoutCallbacks` /
`_runCheckinCallbacks` wrappers over it. None of that has a Rails counterpart.

`defineCallbacks` (`packages/activesupport/src/callbacks.ts`) generates `_run<Name>Callbacks` on
its target, so the generated runners are available to converge onto.

A second hand-written spelling of a generated runner sits in
`packages/actionpack/src/abstract-controller/base.ts`, which imports `processAction` from
`./callbacks.js` under the alias `_runProcessActionCallbacks`; Rails'
`AbstractController::Callbacks#process_action` (`abstract_controller/callbacks.rb:259-265`) calls
`run_callbacks(:process_action)`, and no `_run_process_action_callbacks` call exists there.

## Acceptance criteria

- [ ] `AbstractAdapter` includes `ActiveSupport::Callbacks` and calls
      `defineCallbacks` for `checkout` and `checkin`; `_connectionCallbacks`, `_runCallbacks` and
      the two hand-written runners are deleted.
- [ ] Registrations use `setCallback`, as the Rails `set_callback` sites do.
- [ ] `connection-pool.ts`'s `typeof c._runCheckinCallbacks === "function"` guard is dropped
      (`connection_pool.rb:582` has none).
- [ ] `abstract-controller/base.ts` no longer aliases `processAction` as a `_run*Callbacks` name.
- [ ] `pnpm parity:api:calls` green.
