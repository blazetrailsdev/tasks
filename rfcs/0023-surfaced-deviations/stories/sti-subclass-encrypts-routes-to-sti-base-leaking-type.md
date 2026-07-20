---
title: "sti-subclass-encrypts-routes-to-sti-base-leaking-type"
status: in-progress
updated: 2026-07-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4985
claim: "2026-07-20T01:57:33Z"
assignee: "sti-subclass-encrypts-routes-to-sti-base-leaking-type"
blocked-by: null
closed-reason: null
---

## Context

`Base.encrypts` (`packages/activerecord/src/base.ts:1863`) deliberately routes an
STI subclass declaration to the STI base:

```ts
const target = isStiSubclass(this) ? getStiBase(this) : this;
```

The comment explains this was a workaround: without it, `applyPendingEncryptions`
would "fork `_attributeDefinitions` on the subclass and reintroduce the
shadowing the STI-routing fix is trying to eliminate."

Net effect today: `encrypts` declared on one STI subclass wraps the attribute
type on the STI BASE, so the base and every sibling subclass see the
`EncryptedAttributeType`. Verified by probe on `Company` / a `Company` subclass:
both base and subclass report `EncryptedAttributeType` for the encrypted column.

Rails keeps this per-class — `encrypted_attributes` is a `class_attribute` and
`_default_attributes` replays only that class's own pending decorators
(`vendor/rails/activerecord/lib/active_record/encryption/encryptable_record.rb`,
`vendor/rails/activemodel/lib/active_model/attribute_registration.rb`).

PR #4981 fixed the sibling `normalizes` leak by restoring copy-on-write for an
STI subclass's `_attributeDefinitions` (reflection no longer installs the base's
shared map as an OWN property of the subclass). That likely removes the reason
the `encrypts` STI-base routing existed, so this workaround should now be
re-evaluated and probably dropped. It was left out of #4981 because unwinding it
changes encryption semantics and touches the encryption suite — separate scope.

## Acceptance criteria

- [ ] `encrypts` declared on an STI subclass wraps the cast type for that
      subclass only; the STI base and sibling subclasses keep the undecorated type.
- [ ] The `isStiSubclass` routing in `Base.encrypts` is removed (or its remaining
      justification documented with a test that fails without it).
- [ ] Encryption suite stays green (`packages/activerecord/src/encryption/`).
- [ ] Add an STI-subclass `encrypts` test mirroring the `normalizes` guard in
      `packages/activerecord/src/normalized-attribute.trails.test.ts`.
