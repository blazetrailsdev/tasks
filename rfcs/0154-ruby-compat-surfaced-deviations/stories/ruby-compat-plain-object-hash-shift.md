---
title: "ruby-compat-plain-object-hash-shift"
status: draft
updated: 2026-10-15
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`StatementPool#[]=` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/statement_pool.rb:31`) evicts with `dealloc(cache.shift.last)`. Since trails#8956 the per-pid cache is a plain object, as Rails' `{}` is, and ruby-compat's `Hash#shift` (`packages/ruby-compat/src/hash.ts:1351`) exists only as a method on the `Hash` class. So `packages/activerecord/src/connection-adapters/statement-pool.ts` `set` open-codes it: it takes `Object.entries(this.cache)[0]`, deletes `shifted[0]`, and passes `last(shifted)` to `dealloc`. The call gates do not flag a core `shift`, so no receipt applies, and `no-freeform-comments` strips a prose note at the site.

## Acceptance criteria

- [ ] ruby-compat exports a free `shift(hash)` for `rb_hash_shift` (`vendor/ruby/v3.3.11/hash.c:2492`), with a plain-object arm that removes and answers the first `[key, value]` pair, or `nil` when the hash is empty, and a Map/`Hash` arm. It carries a `@noRailsEquivalent PERMANENT` receipt.
- [ ] `StatementPool#set` is `void this.dealloc(last(shift(this.cache)!) as T)`.
- [ ] The extra-surface and ruby-compat call gates stay green.
