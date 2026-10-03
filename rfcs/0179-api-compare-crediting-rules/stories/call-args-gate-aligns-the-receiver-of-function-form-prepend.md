---
title: "parity: the call-args gate aligns the receiver of a function-form Module#prepend / include / extend"
status: done
updated: 2026-10-03
rfc: "0179-api-compare-crediting-rules"
cluster: call-args
packages: ["activerecord", "actionpack", "actionview", "activesupport"]
deps:
  - call-args-gate-aligns-the-receiver-of-a-function-form-hash-merge
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8432
claim: "2026-10-03T01:25:21Z"
assignee: "call-args-gate-aligns-the-receiver-of-function-form-fetch-and-max"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-subsystems-part-1` audit: the receipts below were `PERMANENT`, no CLAUDE.md section ratifies them, and they are re-tagged `CONVERGEABLE` onto this story.

`ExtendedDeterministicUniquenessValidator.install_support` prepends a module onto the validator
(`vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/extended_deterministic_uniqueness_validator.rb:6-8`):

```ruby
def self.install_support
  ActiveRecord::Validations::UniquenessValidator.prepend(EncryptedUniquenessValidator)
end
```

`packages/activerecord/src/encryption/extended-deterministic-uniqueness-validator.ts` calls
ruby-compat's `prepend(UniquenessValidator.prototype, EncryptedUniquenessValidator)`
(`packages/ruby-compat/src/prepend.ts`, `rb_mod_prepend`, `vendor/ruby/v3.3.11/eval.c:1196`). The
call-argument comparator reads Ruby `(const:EncryptedUniquenessValidator)` against TS
`(ref:prototype, ref:EncryptedUniquenessValidator)`, so the body carries `@missingRailsArgs prepend`.

CLAUDE.md § "Module mixins" names `include()` and `extend()` as the ports of Ruby `include` /
`extend`; it does not name `prepend`. `scripts/api-compare/receiver-as-first-arg.ts`'s
`RECEIVER_AS_FIRST_ARG` holds none of the three. `prepend` is Ruby core `Module#prepend`, which no
Rails class defines, so it qualifies by that table's own rule; the receiver there is a constant path
(`const:`), which `alignBuiltinReceiver` (`scripts/api-compare/call-args.ts`) compares rather than
strips, and the port passes `.prototype` of it.

The same receipt is `PERMANENT` at `packages/activerecord/src/migration/compatibility.ts`
(`compatibleTableDefinition`, `commandRecorder`), and the `include` / `extend` twins at
`encryption/extended-deterministic-queries.ts`, `schema.ts`, `relation/delegation.ts`,
`packages/actionview/src/rendering.ts`, `packages/actionpack/src/action-dispatch/routing/route-set.ts`
and `packages/activesupport/src/tagged-logging.ts`.

## Acceptance criteria

- [ ] The call-argument comparator aligns the leading receiver of a function-form `prepend` (and `include` / `extend`) when the TS callee is the ruby-compat / activesupport export, treating `X.prototype` as the receiver `X`, with unit tests for the aligned case and for a site that passes a different module (still flagged).
- [ ] `extended-deterministic-uniqueness-validator.ts`'s `@missingRailsArgs prepend` is deleted, with every other `@missingRailsArgs prepend` / `include` / `extend` receipt the alignment clears; any that survive are listed in the PR body with the reason.
- [ ] `pnpm parity:api:calls:args` and `:receipts:gate` green with no baseline row added.

## Verification

```bash
pnpm vitest run scripts/api-compare/call-args.test.ts && API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api:calls:args && pnpm parity:api:receipts:gate
```
