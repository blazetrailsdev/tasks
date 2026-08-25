---
title: "suppressed-call-lets-sibling-claim-ts-candidate"
status: done
updated: 2026-08-18
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6729
claim: "2026-08-18T22:11:19Z"
assignee: "suppressed-call-lets-sibling-claim-ts-candidate"
blocked-by: null
closed-reason: null
---

## Context

Direct evidence for RFC 0106 Open Question 1 (the call-set extractor keys a row
by `<tsFile, rubyName>` and credits a TS call to the wrong Ruby call site),
found while burning down `wave-4a-relation-family-residue` (PR #6721).

`ActiveRecord::Delegation::GeneratedRelationMethods#generate_method`
(`vendor/rails/activerecord/lib/active_record/relation/delegation.rb:74-90`)
makes two distinct calls the extractor cannot tell apart:

- `return if method_defined?(method)` — delegation.rb:76
- `!::ActiveSupport::Delegation::RESERVED_METHOD_NAMES.include?(method.to_s)` — delegation.rb:78

`method_defined?` is in the suppressed-call list
(`scripts/api-compare/lint-calls.ts:285`), so it never flags and claims no TS
candidate. `include?` maps to `has` (`scripts/api-compare/enumerable-idioms.ts:41`).

The TS port at `packages/activerecord/src/relation/delegation.ts` (`generateMethod`)
implements ONLY the memo guard, as `if (this._methods.has(name)) return;`. The
extractor credits that `has` to `RESERVED_METHOD_NAMES.include?` and retires the
`generate_method -> include?` baseline row as satisfied — while the reserved-name
guard is not implemented at all (and, per the call-site JSDoc, deliberately has no
arm in TS: it selects between Ruby's two installation spellings, of which the port
has one).

The net effect is that the ledger cannot record the real omission: neither a
`call-mismatches-exclude` row nor a `@missingRailsCall include?` tag survives,
because both go STALE against a call the gate now believes is made. The
justification had to be written as prose JSDoc instead — outside every
machine-checked register.

## Acceptance criteria

- [ ] A call the extractor SUPPRESSES (`lint-calls.ts` list) no longer lets an
      unrelated Ruby call in the same body claim its TS spelling — i.e. a
      suppressed call still consumes the TS candidate it ports, so a sibling
      Ruby call with the same TS mapping keeps flagging.
- [ ] `generate_method -> include?` flags again for
      `activerecord/relation/delegation.ts`, and is carried either as a
      reviewed `call-mismatches-exclude` row or a `@missingRailsCall include?`
      tag at the call site (the prose JSDoc paragraph in `generateMethod`
      explaining why the register could not hold it is then deleted).
- [ ] No net new rows in any baseline; the fix is only-shrink or neutral.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
