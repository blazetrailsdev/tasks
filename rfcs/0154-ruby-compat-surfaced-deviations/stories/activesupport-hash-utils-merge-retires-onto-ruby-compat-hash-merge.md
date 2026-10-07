---
title: "activesupport: hash-utils merge / mergeBang retire onto ruby-compat's Hash#merge / #update"
status: draft
updated: 2026-10-07
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/hash-utils.ts:114-117` exports `merge(hash, otherHash)`, a bare
`{ ...hash, ...otherHash }` spread tagged `@noRailsEquivalent PERMANENT` (and `mergeBang` beside
it). ruby-compat already ports the Ruby method: `merge` in `packages/ruby-compat/src/hash.ts:259`
is `update(dup(hash), …)`, MRI `rb_hash_merge` (`vendor/ruby/v3.3.11/hash.c:4144`), with the
conflict-block arm and `Map` receivers; `update` (`hash.c:4028`) is `Hash#merge!`.

The two share a name, and the call gate credits a Ruby `merge` by callee name, so it cannot tell
which one a port imported. trails#8633 converged three `@missingRailsCall merge` receipts
(`tasks/mysql_database_tasks.rb:79-81`, `tasks/postgresql_database_tasks.rb:23,102-104`,
`validations/associated.rb:10`) onto the activesupport spread first, green on every gate, and only
review sent them to the ruby-compat port. Part 1 of the same audit (trails#8396) converged
`database_configurations/hash_config.rb:68-70`, `url_config.rb:44` and
`connection_url_resolver.rb:64-80` the same way, and those may still import the activesupport one.

## Acceptance criteria

- [ ] Every importer of `merge` / `mergeBang` from `@blazetrails/activesupport` whose Ruby body calls
      `Hash#merge` / `Hash#merge!` imports ruby-compat's `merge` / `update` instead (start with
      `database-configurations/hash-config.ts`, `url-config.ts`, `connection-url-resolver.ts`).
- [ ] `hash-utils.ts`'s `merge` and `mergeBang` are deleted with their `@noRailsEquivalent PERMANENT`
      receipts, or, if a caller needs the Rails-defined `Hash#deep_merge`-family behaviour, kept only
      under the Rails name that defines it.
- [ ] `pnpm parity:api:calls`, `:calls:args` and `:extra:gate` stay green; no baseline row added.
