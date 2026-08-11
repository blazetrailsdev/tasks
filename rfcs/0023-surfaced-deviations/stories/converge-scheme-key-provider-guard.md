---
title: "Scheme#key_provider adds an encryptor: early return Rails has no equivalent for"
status: draft
updated: 2026-08-11
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `Scheme#initialize` onto `context_properties`
(PR #6368, `converge-scheme-encryptor-context-properties`). Left alone there
because it is control flow in a different method, not the constructor.

Rails `Scheme#key_provider`
(`activerecord/lib/active_record/encryption/scheme.rb:56-58`):

```ruby
def key_provider
  @key_provider_param || key_provider_from_key || deterministic_key_provider || default_key_provider
end
```

Four alternatives, no guard. trails
(`packages/activerecord/src/encryption/scheme.ts`, `get keyProvider`) adds a
leading early return Rails does not have:

```ts
get keyProvider(): unknown {
  // When an explicit encryptor is provided, key providers are irrelevant —
  // the encryptor handles encryption without needing key material from here.
  if (this._opts.encryptor !== undefined) return this._keyProviderParam ?? undefined;
  return (
    this._keyProviderParam ?? this.keyProviderFromKey() ?? ...
  );
}
```

With a custom `encryptor:`, Rails still resolves the full chain and would hand
back `default_key_provider`; trails returns `undefined`. Any caller that reads
`scheme.keyProvider` to build encryption options therefore sees a different
value than Rails would.

Two smaller divergences ride along in the same file:

- `isSupportUnencryptedData` / `isFixed` read `this._opts.*` rather than the
  ivars Rails memoizes (`@support_unencrypted_data`, `@fixed ||= ...`);
  `fixed?` in particular is `@deterministic && (!@deterministic.is_a?(Hash) ||
@deterministic[:fixed])` (scheme.rb:52-55), which trails reduces to
  `this._opts.fixed ?? this.deterministic`.

## Converged shape

Drop the early return so `key_provider` is the four-way `||` chain
scheme.rb:57 is, and satisfy whatever the guard was protecting at the reading
call site instead. Establish first WHY it was added — find the caller that
breaks without it and cite it — since removing it changes what a scheme with a
custom `encryptor:` reports.

## Acceptance criteria

- [ ] `keyProvider` is the unguarded four-alternative chain of scheme.rb:57.
- [ ] The condition the guard protected is satisfied at its own call site, with
      the Rails file:line that justifies it — or the guard is shown to be
      unnecessary and simply deleted.
- [ ] `fixed?` ports scheme.rb:52-55 including the Hash arm.
- [ ] Encryption suites green.
