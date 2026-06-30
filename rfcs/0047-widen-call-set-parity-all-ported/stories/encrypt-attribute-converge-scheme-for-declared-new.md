---
title: "Converge EncryptableRecord#encrypt_attribute calls (new, scheme_for, encrypted_attribute_was_declared)"
status: ready
updated: 2026-06-30
rfc: "0047-widen-call-set-parity-all-ported"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced by PR #4302 (wide-call-analyzer-resolve-calls-through-locals). The
instance-scoping fix for helper-delegation resolution stopped a same-named
static helper from masking calls, which un-hid three genuine omissions in
`EncryptableRecord.encryptAttribute` vs Rails `encrypt_attribute`:
`new`, `scheme_for`, `encrypted_attribute_was_declared`. All three are now
baselined in `scripts/api-compare/call-mismatches-wide-exclude.json`.

trails (`packages/activerecord/src/encryption/encryptable-record.ts:226`):

```ts
static encryptAttribute(modelClass, name, options = {}) {
  this.encrypts(modelClass, name, options);
}
```

This is a thin delegating one-liner; Rails' `encrypt_attribute`
(`activerecord/lib/active_record/encryption/encryptable_record.rb`) builds a
scheme (`scheme_for`), records the declaration (`encrypted_attribute_was_declared`),
and instantiates (`.new`). Verify the real Rails method body and reconcile.

## Acceptance criteria

- [ ] Read the Rails `encrypt_attribute` source and confirm which of the three
      omitted calls represent genuine missing behavior vs. a faithful port that
      moved the logic elsewhere (e.g. into `encrypts`).
- [ ] Converge `encryptAttribute` to make the genuinely-required calls, or
      document precisely why each is satisfied via a different path.
- [ ] Drop the converged `encrypt_attribute → {new, scheme_for,
encrypted_attribute_was_declared}` entries from
      `call-mismatches-wide-exclude.json` once they no longer flag.
