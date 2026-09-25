---
title: "has_secure_token ignores ActiveRecord.generate_secure_token_on; loadDefaults 7.1 writes the colon spelling"
status: draft
updated: 2026-09-25
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `has_secure_token` defaults `on:` to `ActiveRecord.generate_secure_token_on`
(`vendor/rails/activerecord/lib/active_record/secure_token.rb:46`), so the 7.1
default `config.active_record.generate_secure_token_on = :initialize`
(`railties/lib/rails/application/configuration.rb:291`) reaches every
`has_secure_token` call. trails' `hasSecureToken`
(`packages/activerecord/src/secure-token.ts:42`) hardcodes
`options?.on ?? "create"`, so the module setting is never read.

The value also has a spelling problem.

- `Configuration#loadDefaults` 7.1 (`packages/trailties/src/application/configuration.ts`)
  writes `activeRecord.generateSecureTokenOn = ":initialize"`, the colon-prefixed
  Symbol spelling.
- `setGenerateSecureTokenOn` (`packages/activerecord/src/active-record.ts`) is typed
  `"create" | "initialize"`.
- `hasSecureToken` compares `on === "initialize"`.

Since #8077's `active_record.set_configs` walks every config key, the
`":initialize"` value now reaches `setGenerateSecureTokenOn`. Once `hasSecureToken`
reads the setting, a colon-prefixed value would install an `:initialize` callback
under a name `setCallback` does not know. The colon is only correct where control
flow turns on Symbol-ness (CLAUDE.md, "A Ruby Symbol is a JS string"), and here it
does not.

## Converged shape

- `hasSecureToken`'s `on` defaults to `generateSecureTokenOn()` when the option is
  absent, as `secure_token.rb:46` does.
- `loadDefaults` 7.1 writes `generateSecureTokenOn = "initialize"` (bare), matching
  the setter's type.

## Acceptance criteria

- With `setGenerateSecureTokenOn("initialize")`, `hasSecureToken` with no `on:`
  generates the token at initialize.
- `config.loadDefaults("7.1")` on a booted app makes `generateSecureTokenOn()`
  return `"initialize"`.
