---
title: "ruby-compat: Exception#name answers the receiver's own class path, not the nearest ancestor's assigned string"
status: draft
updated: 2026-10-02
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat", "activerecord"]
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

Found while auditing `encryption/errors.ts` for `activerecord-audit-permanent-receipts-subsystems-part-1` (trails#8396).

Ruby names an exception by its own class. `exc_inspect` and `exc_to_s` both read
`rb_class_name(CLASS_OF(exc))` (`vendor/ruby/v3.3.11/error.c:1467,1685,1689`), so
`ActiveRecord::Encryption::Errors::Decryption.new.inspect` is
`#<ActiveRecord::Encryption::Errors::Decryption: …>` although the class body is empty
(`vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/errors.rb:6-12`).

ruby-compat assigns the name per class by hand: `Exception.prototype.name = "Exception"`
(`packages/ruby-compat/src/exception.ts`), `StandardError.prototype.name = "StandardError"`
(`packages/ruby-compat/src/standard-error.ts`). A subclass that assigns nothing inherits the
nearest ancestor's string, so every bodiless Rails error reports its parent's name:

| Class                                                                                                                    | Rails                                          | trails `name`   |
| ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- | --------------- |
| `ActiveRecord::Encryption::Errors::Decryption` (and the six beside it, `packages/activerecord/src/encryption/errors.ts`) | `ActiveRecord::Encryption::Errors::Decryption` | `StandardError` |
| `ActiveSupport::Enumerable::SoleItemExpectedError` (`packages/activesupport/src/core-ext/enumerable.ts`)                 | its own path                                   | `StandardError` |
| `ActionController::Live::ClientDisconnected` (`packages/actionpack/src/action-controller/metal/live.ts`)                 | its own path                                   | `RuntimeError`  |

The alternative in use elsewhere is a constructor whose only job is `this.name = "ActiveRecord::…"`
(`packages/activerecord/src/errors.ts`, one per class), which is the member trails#8396 deleted from
`encryption/errors.ts` because Rails' class has no `initialize`.
`standard-error-message-does-not-default-to-class-name` (this RFC) is the sibling gap on `message`
and wants the same class-name read.

## Acceptance criteria

- [ ] `Exception.prototype.name` is a getter answering the receiver's class path the way `rb_class_name` does: the path `rbModConstSet` recorded for the constructor, else the constructor's own name. No per-class assignment is needed for a bodiless subclass.
- [ ] `new Errors.Decryption("x").name` is `ActiveRecord::Encryption::Errors::Decryption` (the classes are seated through the constant binding that paths them, per CLAUDE.md § "Call-time constant resolution"), with a unit test in ruby-compat and one in `encryption/`.
- [ ] The hand-written `X.prototype.name = "…"` lines in ruby-compat that the getter makes redundant are deleted; the name-only constructors in `packages/activerecord/src/errors.ts` are listed in the PR body as the follow-up population (not converted here).

## Verification

```bash
pnpm vitest run packages/ruby-compat/src packages/activerecord/src/encryption && pnpm parity:api:extra:gate
```
