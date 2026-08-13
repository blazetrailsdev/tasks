---
title: "converge-scheme-to-h-key-set"
status: done
updated: 2026-08-13
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6497
claim: "2026-08-13T22:57:07Z"
assignee: "converge-scheme-to-h-key-set"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `converge-scheme-encryptor-context-properties` (RFC 0099), which
converged `Scheme#initialize` onto `context_properties[:encryptor]` and renamed
trails' `_toOptions` onto the Rails name `to_h`.

Rails (`activerecord/lib/active_record/encryption/scheme.rb:65-68`):

```ruby
def to_h
  { key_provider: @key_provider_param, deterministic: @deterministic, downcase: @downcase, ignore_case: @ignore_case,
    previous_schemes: @previous_schemes_param, **@context_properties }.compact
end
```

Five named keys plus `@context_properties`. trails' `toH`
(`packages/activerecord/src/encryption/scheme.ts`) emits four more —
`key`, `fixed`, `supportUnencryptedData`, `compress`/`compressor` — because
`merge` (`scheme.rb:60-62`) is the only path that carries them and trails keeps
them in `_opts` rather than as ivars Rails re-derives.

In Rails those four are NOT carried across a merge: `key:` is folded into
`key_provider` by `key_provider_from_key`, `fixed?` is memoized off
`@deterministic`, `support_unencrypted_data?` falls through to the global
config, and `compress`/`compressor` have already been absorbed into
`@context_properties[:encryptor]` by the time `to_h` runs.

## Acceptance criteria

- [ ] `toH()` emits exactly the five named keys plus the context properties,
      compacted, as scheme.rb:66-67 does.
- [ ] `merge` still behaves, with each dropped key satisfied the way Rails
      satisfies it (key → key_provider, fixed → deterministic memo,
      supportUnencryptedData → config fallback, compress/compressor →
      context_properties[:encryptor]).
- [ ] `SchemeTest` and the encryption suites stay green.
- [ ] `pnpm parity:api:calls` / `pnpm parity:api:calls:args` green.
