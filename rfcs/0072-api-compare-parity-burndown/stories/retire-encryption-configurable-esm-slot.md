---
title: "Encryption readers reach Configurable through a zero-import slot, not a direct import"
status: done
updated: 2026-08-06
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6146
claim: "2026-08-05T23:53:11Z"
assignee: "pg-schema-statements-abstract-signature-divergences"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/encryption/configurable-slot.ts` (added by PR #6138)
is a zero-runtime-import module that holds the `Configurable` class in a
mutable binding, filled by a `_setConfigurable(Configurable)` call at the bottom
of `configurable.ts`. `Encryptor`, `Context`, `Scheme`, `KeyProvider` and
`KeyGenerator` import `Configurable` **from the slot** rather than from
`configurable.ts`.

Rails has no such module. It resolves the constant when the method runs —
`ActiveRecord::Encryption.config` at `encryption/encryptor.rb:27,173`,
`encryption/context.rb:38`, `encryption/scheme.rb:49,98`,
`encryption/key_provider.rb:22`, `encryption/key_generator.rb:11,45`;
`.cipher` at `encryption/encryptor.rb:108`; `.key_provider` at
`encryption/encryptor.rb:98` and `encryption/scheme.rb:103`;
`.message_serializer` at `encryption/encryptor.rb:132` — so naming it costs
those files no load order at all.

The slot exists because ESM has no call-time constant resolution.
`configurable.ts` imports `config.ts`, `context.ts` and `contexts.ts`
(`encryption/configurable.rb:9,17,33,36`), which reach `Encryptor` and
`KeyProvider` again, so an eager `import` of `configurable.js` from any of the
five readers puts `EncryptingOnlyEncryptor extends Encryptor`
(`encryption/encrypting_only_encryptor.rb:6`) and
`DerivedSecretKeyProvider extends KeyProvider`
(`encryption/derived_secret_key_provider.rb:6`) inside a cycle: entered at
`encryptor.ts` or `key-provider.ts`, the subclass evaluates with its superclass
still in TDZ. Reproduced with a plain-node import of the built
`dist/encryption/encryptor.js` / `key-provider.js` as entry modules.

Two alternatives were tried and rejected in #6138 and should not be re-tried
blind:

- Deferring only `contexts.ts -> EncryptingOnlyEncryptor` breaks the
  `encryptor.ts` cycle but not `key-provider.ts`'s, which runs through
  `config.ts -> derived-secret-key-provider.ts` and
  `config.ts -> scheme.ts -> deterministic-key-provider.ts`.
- Deferring each subclass edge instead needs four slots **and fails at
  runtime**: nothing then loads the provider modules, so the ctor is
  unregistered when `Configurable.configure` runs and 37 encryption suites go
  red.

The same shape already exists at `associations/collection-proxy-slot.ts`, so
this is the second instance of the idiom, not the first — which is the argument
for solving the class rather than the instance.

## Converged shape

The five readers import `Configurable` from `configurable.ts` directly and the
slot module is deleted, with the cycle broken structurally instead. Candidate
levers, in rough order of preference:

- Split `configurable.ts` so the `config` singleton reader does not drag
  `context.ts` / `contexts.ts` in with it — Rails' `Configurable` is one module,
  but `mattr_reader :config` (`encryption/configurable.rb:9`) and the
  `Context::PROPERTIES` delegation (`encryption/configurable.rb:16-19`) have
  genuinely different dependency footprints.
- Move the `extends` sites out of the cycle rather than the readers, e.g. by
  giving `config.ts` a path to `DerivedSecretKeyProvider` that does not run
  through `key-provider.ts` at module-eval time.
- Accept the idiom as the settled trails answer for Ruby's call-time constant
  resolution, and if so, say that once — in `docs/ruby-ts-conventions.md` or
  `CLAUDE.md`'s "Module mixins" section — so it stops being re-derived per
  cluster, and give both existing slots a single shared justification instead
  of two bespoke ones.

Whichever lever wins, the acceptance bar is unchanged from #6138: a plain-node
import of the BUILT `dist/encryption/{encryptor,contexts,configurable,key-provider,config,context,scheme,key-generator}.js`
as **entry modules** must all succeed. Vitest's setup files enter
`configurable.js` first and mask the TDZ, so a green suite proves nothing here.

## Acceptance criteria

- [ ] The five readers import `Configurable` from `configurable.ts`.
- [ ] `configurable-slot.ts` is deleted.
- [ ] All eight built `dist/encryption/*.js` entry modules above import clean
      under plain node.
- [ ] Encryption suites green on all three lanes.
- [ ] If the conclusion is instead that the idiom stays, this story is closed by
      writing it down as a repo-wide convention with both call sites pointing at
      it — not by re-justifying the slot in place.
