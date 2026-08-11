---
title: "Scheme#initialize builds an Encryptor only on Rails' two guarded branches"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: 6368
claim: "2026-08-11T16:13:43Z"
assignee: "naming-burndown-ar-field-and-body-restructures"
blocked-by: null
closed-reason: null
---

## Context

Left unconverged by `call-args-ar-kwargs-vs-positional` (PR #6360). This is a
control-flow divergence surfaced as a call-argument row, so the row cannot be
retired by editing arguments.

Rails `Scheme#initialize`
(`activerecord/lib/active_record/encryption/scheme.rb:13-33`):

```ruby
@compress = compress
@compressor = compressor

validate_config!

@context_properties[:encryptor] = Encryptor.new(compress: @compress) unless @compress
@context_properties[:encryptor] = Encryptor.new(compressor: compressor) if compressor
```

Rails constructs an `Encryptor` **only** when `compress` is false or a
`compressor` was given, and installs it into `context_properties[:encryptor]` —
so with the defaults (`compress: true`, no compressor) no encryptor is built at
all and the context's own encryptor is used.

trails (`packages/activerecord/src/encryption/scheme.ts`, constructor) always
constructs one:

```ts
} else {
  this._encryptor = new Encryptor({ compress: options.compress, compressor: options.compressor });
}
```

and stores it on `_encryptor` rather than routing through context properties.
It also wraps a caller-supplied encryptor in a `LegacyEncryptorShim`, which has
no Rails counterpart.

## Converged shape

Port the two conditional assignments verbatim, into
`context_properties[:encryptor]`, with the `unless @compress` / `if compressor`
guards and Rails' kwarg per branch. Retire `LegacyEncryptorShim` or justify it
at the call site.

Related prior context: `project_support_unencrypted_data_masks_expansion_ciphertext_bugs`
and the `encryption/configurable-slot.ts` load-order note in CLAUDE.md.

## Acceptance criteria

1. Both `Encryptor.new` calls match `encryption/scheme.rb:32-33` in guard,
   order, and kwarg.
2. No encryptor is constructed on the default path (`compress: true`, no
   compressor); a test covers that and fails on the current implementation.
3. The two `encryption/scheme.ts` `initialize` → `new` rows are deleted from the
   baseline by hand.
4. `pnpm parity:api:calls:args` stays green; `pnpm parity:api:extra --package
activerecord` does not grow.
