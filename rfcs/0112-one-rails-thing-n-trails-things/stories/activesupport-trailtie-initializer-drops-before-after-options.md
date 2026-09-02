---
title: "activesupport Trailtie.initializer takes no before:/after:/group: options"
status: ready
updated: 2026-09-02
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' framework railtie initializers carry ordering options — every
`<framework>.deprecator` is `before: :load_environment_config`
(`activerecord/lib/active_record/railtie.rb:79`,
`activesupport/lib/active_support/railtie.rb:12`), while
`active_support.deprecation_behavior` carries none
(`activesupport/lib/active_support/railtie.rb:38`), so by the time it runs
every deprecator is registered. `Initializable::Initializer` holds
`before` / `after` / `group` (`railties/lib/rails/initializable.rb:14-40`),
`Collection#tsort_each_child` sorts on them (`:49-52`), and
`ClassMethods#initializer` chains `after` to the previous one when neither is
given (`:86-92`).

`packages/activesupport/src/trailtie.ts`'s `initializer(name, block)` takes no
options at all — it pushes `{ name, block }` and runs them in registration
order. `packages/trailties/src/initializable.ts` has the faithful port, and
`Application#railtiesInitializers` (PR #7375) binds the registry's blocks with
an empty options object, so a framework initializer cannot express ordering.

The consequence is already written down as a caveat in
`packages/trailties/src/trailties/active-support.ts`: a framework whose
`.deprecator` initializer is registered after
`active_support.deprecation_behavior` does not get the configured behavior,
where in Rails the `before:` guarantees it does. Registration order is import
order, which is not a contract.

## Converged shape

`Trailtie.initializer` takes Rails' `(name, options = {}, &block)` signature
and the registry stores the options, so the binding in
`railtiesInitializers` passes them through to `Initializer` and the existing
tsort orders them. If [[fold-the-two-trailtie-ports-into-one]] lands first this
falls out of it for free — file order accordingly rather than doing both.

## Acceptance criteria

- [ ] `Trailtie.initializer("x", { before: "y" }, block)` orders as Rails does.
- [ ] `<framework>.deprecator` initializers carry
      `before: "load_environment_config"`, as their Ruby counterparts do.
- [ ] The ordering caveat comment in
      `trailties/src/trailties/active-support.ts` is deleted, not reworded.
- [ ] Existing `RailtieTest` cases in each package keep their names.
