---
title: "activerecord: Fixture#initialize runs EncryptedFixtures' prepended initialize (blocked on a constructor hook)"
status: blocked
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: excluded-files
packages: ["activerecord"]
deps: ["activemodel-api-initialize-concern-constructor"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: "TS language: a JS class constructor cannot be wrapped after definition; ruby-compat prepend() wraps prototype methods only, and CLAUDE.md ratifies no constructor-splicing mechanism. Blocked with activemodel-api-initialize-concern-constructor on a ruby-compat construction hook."
closed-reason: null
---

## Context

`SCOPED_SKIP_GROUPS[15]` exempts `ActiveRecord::Fixture#initialize` (`vendor/rails/v8.0.2/activerecord/lib/active_record/fixtures.rb:817-820`), which
`Encryption::EncryptedFixtures` prepends onto (`vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/encrypted_fixtures.rb:6-11`): the module's
`initialize` runs first and reaches the class's through `super`. ruby-compat's `prepend()`
(`packages/ruby-compat/src/prepend.ts`) wraps prototype methods and cannot wrap a constructor, so trails
keeps an `initialize` method its constructor delegates to. Same gap as
`activemodel-api-initialize-concern-constructor`.

## Acceptance criteria

- [ ] ruby-compat can prepend a module `initialize` into a class's construction, `EncryptedFixtures` uses it, and `SCOPED_SKIP_GROUPS[15]` is deleted.

## Verification

```bash
pnpm build && pnpm parity:api && pnpm parity:skips:stories && pnpm parity:api:calls
```
