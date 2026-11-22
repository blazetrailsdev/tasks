---
title: "engine-installed-base-class-methods-are-untyped"
status: done
updated: 2026-11-22
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10561
claim: "2026-11-22T13:52:04Z"
assignee: "activerecord-test-support-helper-stand-ins-remainder"
blocked-by: null
closed-reason: null
---

## Context

The engines install class methods onto `ActiveRecord::Base` at boot through load hooks:
`hasOneAttached` / `hasManyAttached` (`packages/activestorage/lib/attached/model.ts:229`, Rails
`activestorage/lib/active_storage/engine.rb` `on_load(:active_record) { include ActiveStorage::Attached::Model }`),
`hasRichText` (`packages/actiontext/lib/attribute.ts:112`), and `broadcastsTo`
(`packages/turbo/lib/engine.ts:143`, `include(this, Broadcastable)`). None of them reach a model's static
type, so app code writes `(this as unknown as Attachable).hasOneAttached(...)` (see
`packages/activestorage/test/models/attached/one.test.ts:850`, `packages/actiontext/test/dummy/app/models/message.ts:14`).
`examples/homepage/app/models/application-record.ts` (trails#10547) works around it with
`declare static` members on `ApplicationRecord`.

Mailer actions called as class methods (`PostMailer.published(post)`, Rails `ActionMailer::Base.method_missing`)
have the same gap: `examples/homepage/app/mailers/post-mailer.ts` declares `static published`.

## Acceptance criteria

- Importing an engine package augments `Base`'s static type (module augmentation) with the methods its load hook installs.
- `examples/homepage` drops its `declare static` workarounds and still passes `pnpm typecheck`.
- The test-side `as unknown as` casts for these methods are removed.
