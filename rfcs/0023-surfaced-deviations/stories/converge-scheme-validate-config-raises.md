---
title: "Scheme#validate_config! has a fifth raise and five reworded messages"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "merged into converge-scheme-key-provider-guard — both are leftovers from PR #6368 in encryption/scheme.ts (scheme.rb:56-58 and validate_config!), same file, same read"
---

## Context

Surfaced while converging `Scheme#initialize` (PR #6368,
`converge-scheme-encryptor-context-properties`). That PR moved
`validate_config!` to Rails' position in the constructor and repointed two of
its checks at the new ivars, but did NOT touch the raises themselves.

CLAUDE.md, "Fidelity is the job": _"Errors. Same error class, same message
string, same raise site."_ All five raises diverge.

Rails `validate_config!`
(`activerecord/lib/active_record/encryption/scheme.rb:71-76`) — FOUR raises:

```ruby
raise Errors::Configuration, "ignore_case: can only be used with deterministic encryption" if @ignore_case && !@deterministic
raise Errors::Configuration, "key_provider: and key: can't be used simultaneously" if @key_provider_param && @key
raise Errors::Configuration, "compressor: can't be used with compress: false" if !@compress && @compressor
raise Errors::Configuration, "compressor: can't be used with encryptor" if @compressor && @context_properties[:encryptor]
```

trails (`packages/activerecord/src/encryption/scheme.ts`,
`validateConfigBang`) — FIVE, every message reworded:

| Rails                                                         | trails                                             |
| ------------------------------------------------------------- | -------------------------------------------------- |
| `ignore_case: can only be used with deterministic encryption` | `ignoreCase requires deterministic encryption`     |
| — (no such raise)                                             | `downcase requires deterministic encryption`       |
| `key_provider: and key: can't be used simultaneously`         | `key and keyProvider can't be used simultaneously` |
| `compressor: can't be used with compress: false`              | `compressor can't be used with compress: false`    |
| `compressor: can't be used with encryptor`                    | `compressor can't be used with encryptor`          |

The extra `downcase && !deterministic` raise is the substantive one: Rails
accepts `downcase: true` without `deterministic:` (the constructor does
`@downcase = downcase || ignore_case`, scheme.rb:22, and only `ignore_case`
gates), so trails rejects a configuration Rails allows. The message strings are
mechanical but are what a Rails dev greps for, and the Rails ones keep the
trailing colon that names the offending kwarg.

## Converged shape

Port the four raises verbatim — same order, same guards, same message strings
including the kwarg colons — and delete the `downcase` raise unless a Rails
`file:line` can be produced that rejects that configuration.

## Acceptance criteria

- [ ] `validateConfigBang` raises exactly the four raises of scheme.rb:71-76,
      in order, with the Rails message strings byte-for-byte.
- [ ] `new Scheme({ downcase: true })` no longer throws, or the extra raise is
      justified with a Rails citation.
- [ ] `SchemeTest`'s "validates config options when using encrypted attributes"
      still passes; any assertion that depended on the reworded strings is
      updated to the Rails strings (test NAMES unchanged).
- [ ] Encryption suites green.
