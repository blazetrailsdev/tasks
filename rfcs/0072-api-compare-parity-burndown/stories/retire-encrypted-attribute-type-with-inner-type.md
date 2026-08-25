---
title: "EncryptedAttributeType#withInnerType is untagged novel surface with no Rails counterpart"
status: done
updated: 2026-08-06
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6156
claim: "2026-08-06T14:43:07Z"
assignee: "ruby-time-carries-no-fractional-seconds"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:extra --package activerecord` reports
`encryption/encrypted-attribute-type.ts — 1 novel`, and the novel name is
`withInnerType` (`packages/activerecord/src/encryption/encrypted-attribute-type.ts:64-71`).
It carries no `@noRailsEquivalent` tag, so it is untracked extra surface.

`ActiveRecord::Encryption::EncryptedAttributeType` has no such method —
`vendor/rails/activerecord/lib/active_record/encryption/encrypted_attribute_type.rb`
exposes `scheme` / `cast_type` as `attr_reader` (`:12`) and never re-wraps
itself. Rails re-decorates by re-running `decorate_attributes`
(`encryptable_record.rb:86-95`), which builds a fresh `EncryptedAttributeType`
through `scheme_for` rather than cloning an existing one.

Its own JSDoc says the method exists as a duck-typed contract shared with the
simpler Encryptor-based `EncryptedAttributeType` in the parent directory, so
"consumers can unify on a single check instead of branching on `instanceof`" —
i.e. it is an abstraction Rails does not have, invented to serve a second
trails-only type.

Confirmed pre-existing (not introduced by PR #6116); called out there because
the file was otherwise being converged.

## Converged shape

Find the callers (schema reflection is the one the JSDoc names) and have them
construct through the same path Rails does rather than re-wrapping an existing
type instance. If the adapter-resolved cast type genuinely arrives after the
type is built, converge on Rails' re-decoration rather than a bespoke
`withInnerType` clone.

If a caller truly cannot be converged, the fallback is a
`@noRailsEquivalent <reason>` receipt at the declaration — but that is the
fallback, not the goal, and the parent-directory duck-typing partner should be
examined in the same pass (it may be the actual thing to retire).

## Acceptance criteria

- [ ] `pnpm parity:api:extra --package activerecord` reports 0 novel for
      `encryption/encrypted-attribute-type.ts`, without an allowlist row.
- [ ] Encryption suites green on all three lanes.
