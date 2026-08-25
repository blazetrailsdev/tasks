---
title: "Configurable.onConfigure and the default-key-provider cache are trails inventions"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: 6108
claim: "2026-08-05T00:59:03Z"
assignee: "i18n-date-valid-date-frags-weeknum-blocks"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/encryption/configurable.ts:99` defines
`Configurable.onConfigure(hook)`, a hook registry Rails does not have —
`pnpm parity:api:extra --package activerecord` reports it as novel surface on that
file. Its only consumer is `default-key-provider-cache.ts`, itself a trails
invention: a module-level single-entry memo of the default
`DerivedSecretKeyProvider`, cleared by the hook whenever `configure` runs.

Rails has neither. `ActiveRecord::Encryption::Configurable#configure`
(vendor/rails/activerecord/lib/active_record/encryption/configurable.rb:20-30)
ends with `reset_default_context`, and the key provider is rebuilt from config
through `Scheme#key_provider` / `Context` each time — there is no cache to
invalidate and so no hook to register.

Surfaced while doing `converge-encryption-config-previous-schemes-to-scheme-instances`
(#6102): giving `Config` a value dependency on `Scheme` (config.rb:65-67) pulled
`config.ts` into the encryption import cycle, and
`default-key-provider-cache.ts`'s top-level `Configurable.onConfigure(...)` then
ran against a half-initialized `configurable.js`. The registration was moved to
`configurable.ts` to break that — a placement fix, not a convergence. The cycle
exists only because of the invented cache.

## Converged shape

- Delete `default-key-provider-cache.ts` and rebuild the key provider the way
  Rails does, through the scheme/context path.
- Delete `Configurable.onConfigure` and its registration line
  (`configurable.ts:131`) once nothing consumes it, and converge `configure` on
  configurable.rb:20-30's `reset_default_context` ending.
- If a memo is genuinely load-bearing for PBKDF2 cost, measure it first: the
  burden is a benchmark, not an assumption, and a kept cache needs a
  `@noRailsEquivalent` receipt rather than silence.

## Acceptance criteria

- [ ] `onConfigure` no longer appears in `pnpm parity:api:extra --package activerecord`
      for `encryption/configurable.ts`.
- [ ] No module in `encryption/` registers a configure hook.
- [ ] Encryption suites green on all three lanes, and the encryption import
      graph has no cycle through `config.ts`.
