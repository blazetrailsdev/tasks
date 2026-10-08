---
title: "activesupport: Delegation.generate takes Rails' nilable / as / private / signature kwargs"
status: ready
updated: 2026-10-08
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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

Surfaced by trails#8669, which ported the `receiver == "self.class"` arm's `nilable = false` as a local.

Rails' `ActiveSupport::Delegation.generate`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/delegation.rb:21`) is

```ruby
def generate(owner, methods, location: nil, to: nil, prefix: nil, allow_nil: nil, nilable: true, private: nil, as: nil, signature: nil)
```

`packages/activesupport/src/delegation.ts` `Delegation.generate` takes `{ to, prefix, allowNil }` only
(`DelegateOptions`). So:

- `nilable:` is a kwarg in Rails (`:21`), read at `:114` to emit the bare call; trails declares it as a local initialised to `true`, and a caller cannot pass `nilable: false`.
- `as:` (`:56-58`) names the receiver class explicitly and sets `explicit_receiver`, which makes a missing method re-raise (`:87`); trails has no such arm.
- `private:` (`:69`) and `signature:` are absent. `private:` has no run-time carrier (CLAUDE.md § "Method visibility is compile-time only"), so decide whether it is accepted and ignored or skipped.
- `Module#delegate` (`activesupport/lib/active_support/core_ext/module/delegation.rb`) forwards these kwargs; `packages/activesupport/src/module-ext.ts` `delegate` carries `@missingRailsArgs generate — PERMANENT` for the dropped ones.

## Acceptance criteria

- [ ] `Delegation.generate` and `delegate` accept `nilable` and `as` with Rails' defaults and arms (`delegation.rb:21,56-62,83-90,114`), with activesupport tests.
- [ ] `private` / `signature` / `location` are each ported or carry a receipt citing the language shortcoming; the `@missingRailsArgs generate — PERMANENT` receipt on `delegate` is narrowed or deleted accordingly.
- [ ] `pnpm parity:api:calls:args` and `pnpm parity:api:params` stay green.
