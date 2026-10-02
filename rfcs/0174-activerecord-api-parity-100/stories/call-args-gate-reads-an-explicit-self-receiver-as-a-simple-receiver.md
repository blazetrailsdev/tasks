---
title: "parity: the call-args gate reads an explicit-self receiver (self.foo.last) as a simple receiver"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: receipts
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-subsystems-part-1` audit, which converged
`Contexts.current_custom_context` onto ruby-compat's `last` and was left with the argument row below.

`vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/contexts.rb:66-68`:

```ruby
def current_custom_context
  self.custom_contexts&.last
end
```

`packages/activerecord/src/encryption/contexts.ts` is
`this.customContexts && last(this.customContexts)` (`packages/ruby-compat/src/array.ts` `last`,
`rb_ary_last`, `vendor/ruby/v3.3.11/array.c:1914`). The call-set gate credits `last`. The
call-argument gate reports Ruby `()` against TS `(ref:customContexts)`, so the getter carries
`@missingRailsArgs last — CONVERGEABLE` onto this story.

The same convergence in `encryption/key-provider.ts` (`@keys.last` → `last(this._keys)`) and
`encryption/encrypted-attribute-type.ts` (`previous_types.first` → `first(this.previousTypes)`) raises
no shape row: `alignPortedReceiver` (`scripts/api-compare/call-args.ts`) prepends the Ruby receiver
when the extractor records it as a simple `id:` ref. An explicit-self send (`self.custom_contexts`)
is recorded as a chained `call:` receiver instead, so nothing is prepended, although
`self.custom_contexts` and a bare `custom_contexts` are the same send.

## Acceptance criteria

- [ ] The Ruby extractor (or `alignPortedReceiver`) reads a receiver that is a zero-argument send on `self` (`self.foo`, with or without `&.`) as the simple receiver `id:foo`, with unit tests for that case and for a genuinely chained receiver (`a.b.last`) staying unaligned.
- [ ] `contexts.ts`'s `@missingRailsArgs last` is deleted and `pnpm parity:api:calls:args` is green with no baseline row added.
- [ ] Any other receipt the change clears is deleted in the same PR.

## Verification

```bash
pnpm vitest run scripts/api-compare/call-args.test.ts && API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api:calls:args && pnpm parity:api:receipts:gate
```
