---
title: "module-ext-delegate-should-call-delegation-generate"
status: done
updated: 2026-08-22
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6863
claim: "2026-08-22T16:20:03Z"
assignee: "module-ext-delegate-should-call-delegation-generate"
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/call-mismatches-exclude/activesupport/module-ext.json`
carries a `kind: "set"` row whose own reviewed reason names it a real
divergence, not a language shortcoming:

> Rails' `delegate` is a thin front for `ActiveSupport::Delegation.generate`
> (delegation.rb:280), the module trails has not ported; `delegate`
> reimplements the method generation inline instead. A real divergence,
> surfaced (not introduced) by bucketing `core_ext/module/delegation.rb` on
> module-ext.ts.

Rails: `vendor/rails/activesupport/lib/active_support/core_ext/module/delegation.rb:280`
is `Delegation.generate(self, methods, location: caller_locations(1, 1).first, **options)`
— `delegate` does no generation of its own; the whole method-emitting body
lives in `vendor/rails/activesupport/lib/active_support/delegation.rb`.

trails: `packages/activesupport/src/module-ext.ts` inlines that generation into
`delegate` itself.

Per CLAUDE.md, a documented deviation is debt, not permission, and the fix here
is convergence — port `ActiveSupport::Delegation` to its own file at the
conventional path and make `delegate` (and `delegate_missing_to`, which Rails
routes through `Delegation.generate_method_missing`, delegation.rb:329) call
into it. This was excluded from `wave-5-tail-sweep` because it is a port, not a
tag migration.

## Acceptance criteria

- [ ] `ActiveSupport::Delegation` is ported at the path `docs/ruby-ts-conventions.md` produces for `activesupport/lib/active_support/delegation.rb`, method by method against the Ruby.
- [ ] `module-ext.ts`'s `delegate` calls `Delegation.generate` and carries no inlined generation of its own; `delegateMissingTo` routes through `Delegation.generateMethodMissing`.
- [ ] The `module-ext.json` `generate` baseline row is deleted (converged), not re-justified, and the shard deleted if emptied.
- [ ] `pnpm parity:api`, `pnpm parity:test` deltas non-negative; `pnpm parity:api:extra --package activesupport` shows no new untagged surface.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green; all three DB lanes green.
