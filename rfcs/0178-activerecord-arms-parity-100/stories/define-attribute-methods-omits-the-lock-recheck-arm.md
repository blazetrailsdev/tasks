---
title: "activerecord: define_attribute_methods omits the re-check inside GeneratedAttributeMethods::LOCK"
status: claimed
updated: 2026-10-10
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-10-10T16:39:42Z"
assignee: "base-load-schema-primary-key-warm-arm-moves-to-primary-key-resolution"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:arms:report --package=activerecord` reports `activerecord/attribute-methods.ts#defineAttributeMethods  count  -if` in the missing direction.

Rails' `define_attribute_methods`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/attribute_methods.rb:104-125`) tests `return false if @attribute_methods_generated` twice: once at `:105`, and again at `:109` inside `GeneratedAttributeMethods::LOCK.synchronize do` (`:108`). `LOCK` is `Monitor.new` (`:26`). The port in `packages/activerecord/src/attribute-methods.ts` has the first test only and no `LOCK`.

Until trails#8724 the row was hidden: an invented own-property guard added one `if`, which cancelled the missing one in the count. That PR removed the guard. A literal second copy of the test was tried there and rejected in review, because with no lock between them the two tests are adjacent and identical.

ruby-compat's `synchronize` (`packages/ruby-compat/src/monitor.ts`) is `async`, and `defineAttributeMethods` is synchronous and called from synchronous paths, so the monitor cannot wrap the body as it stands. `packages/activerecord/CLAUDE.md` § "The pool monitor guards only sections that span an `await`" ratifies leaving a synchronous section unwrapped for `ConnectionPool`; it does not name this lock.

## Acceptance criteria

- [ ] Either `GeneratedAttributeMethods.LOCK` is ported and `defineAttributeMethods` runs `:109-121` inside it with the second test in place, or the omission is recorded where the arms report reads it, so the row is receipted and not bare.
- [ ] If the omission is permanent, the CLAUDE.md section names `GeneratedAttributeMethods::LOCK` (`attribute_methods.rb:26, 108, 144`) beside the pool monitor.
- [ ] `alias_attribute`'s use of the same lock is checked in the same change: Rails' `generate_alias_attributes` takes `LOCK.synchronize` at `:144`.
- [ ] The arms report shows no unreceipted row for `defineAttributeMethods`.
