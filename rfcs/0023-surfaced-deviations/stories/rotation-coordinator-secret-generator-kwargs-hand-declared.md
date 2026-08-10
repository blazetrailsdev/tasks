---
title: "RotationCoordinator secret-generator kwargs are hand-declared, not reflected"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Not convergent: normalize_options (rotation_coordinator.rb:65-73) reflects on Ruby keyword parameters, which TypeScript cannot do. The remaining ask — make a missing 'parameters' declaration loud — is API ergonomics for a trails-only workaround, not movement toward Rails."
---

## Context

`RotationCoordinator#normalize_options`
(`vendor/rails/activesupport/lib/active_support/messages/rotation_coordinator.rb:65-73`)
splits the `rotate` options into the ones the secret generator accepts and the
ones the codec accepts by reflecting on the generator's keyword parameters:

```ruby
secret_generator_kwargs = options[:secret_generator].parameters.
  filter_map { |type, name| name if type == :key || type == :keyreq }
options[:secret_generator_options] = options.extract!(*secret_generator_kwargs)
```

TypeScript has no parameter reflection, so
`packages/activesupport/src/messages/rotation-coordinator.ts` (PR #5974) reads
the names off an optional `parameters` property the generator declares itself:

```ts
export interface SecretGenerator {
  (salt: string, options: Record<string, unknown>): unknown;
  parameters?: readonly string[];
}
```

A generator that forgets to declare `parameters` silently receives an empty
options object and its keys stay on the codec options instead — the failure is
quiet, and every caller (`MessageVerifiers`, `MessageEncryptors`, and any app
passing a custom `secretGenerator:`) inherits the convention. The wide
call-mismatch for `filter_map` is baselined at
`scripts/api-compare/call-mismatches-wide-exclude/activesupport/messages/rotation-coordinator.json`.

## Acceptance criteria

- Decide and implement the converged shape: either derive the kwarg names
  without a hand-declared property (e.g. a `secretGenerator` wrapper/factory
  that carries them, so declaring them is not optional), or make the omission
  loud rather than silent.
- If the current shape is kept, the reason is recorded once at the call site and
  the wide-exclude entry points at it.
- `pnpm typecheck`, `pnpm lint`, and the messages tests stay green;
  `parity:api` for `messages/rotation_coordinator.rb` stays 11/11.
