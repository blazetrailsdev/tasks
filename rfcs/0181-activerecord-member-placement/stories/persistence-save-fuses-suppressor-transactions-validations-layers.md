---
title: "activerecord: Persistence#save fuses the Suppressor, Transactions and Validations save layers and writes the STI column inline"
status: ready
updated: 2026-10-07
rfc: "0181-activerecord-member-placement"
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

Found while converging `create_or_update` in trails#8595.

`packages/activerecord/src/persistence.ts#save` is one body that fuses four Rails `save` layers, each of which is a separate one-line method calling `super`:

- `Suppressor#save` — `Suppressor.registry[self.class.name] ? true : super` (`vendor/rails/v8.0.2/activerecord/lib/active_record/suppressor.rb:51-53`)
- `Transactions#save` — `with_transaction_returning_status { super }` (`vendor/rails/v8.0.2/activerecord/lib/active_record/transactions.rb:360-362`)
- `Validations#save` — `perform_validations(options) ? super : false` (`vendor/rails/v8.0.2/activerecord/lib/active_record/validations.rb:18-20`)
- `Persistence#save` — `create_or_update(**options, &block)` with `rescue ActiveRecord::RecordInvalid; false` (`vendor/rails/v8.0.2/activerecord/lib/active_record/persistence.rb:390-394`)

The fused body also makes two calls none of those Rails methods make:

- `await this.constructor.ensureSchemaLoaded()` before the transaction.
- An inline STI write: `if (this._newRecord && isStiSubclass(ctor)) { ... this._attributes.writeCastValue(col, this.constructor.name) }`. Rails writes the inheritance column in `Inheritance#ensure_proper_type`, called from `initialize_internals_callback` / `initialize_dup` (`vendor/rails/v8.0.2/activerecord/lib/active_record/inheritance.rb`), which trails already ports (`packages/activerecord/src/inheritance.ts#ensureProperType`). It never writes it in `save`.

`saveBang` in the same file has the same fusion: it calls `this.save(...)` and raises afterwards, where Rails' `Persistence#save!` is `create_or_update(**options, &block) || raise(RecordNotSaved.new("Failed to save the record", self))` (`persistence.rb:423-425`) under `Validations#save!` (`validations.rb:24-26`), `Transactions#save!` (`transactions.rb:364-366`) and `Suppressor#save!` (`suppressor.rb:55-57`).

`create_or_update` itself already uses the layered shape: `base.ts` chains `Timestamp.createOrUpdate -> Callbacks.createOrUpdate -> Persistence.createOrUpdate`, each taking a `superFn`.

## Converged shape

One TS function per Rails method, in the file mirroring its `.rb`, chained in `base.ts` the way `createOrUpdate` and `touch` are: `Suppressor.save -> Transactions.save -> Validations.save -> Persistence.save`, and the same for `saveBang`. `Persistence#save` is `createOrUpdate` plus the `RecordInvalid` rescue and nothing else. The inline STI write is deleted (or, if a test shows `ensureProperType` misses a case, that case is fixed in `ensureProperType`). `ensureSchemaLoaded` in `save` is removed or, if the cold-schema path needs it, justified against CLAUDE.md "Schema reflection peeks at a warm cache".

## Acceptance criteria

- [ ] `Persistence#save` / `#saveBang` bodies match `persistence.rb:390-394` / `:423-425`.
- [ ] `Suppressor`, `Transactions` and `Validations` each own their `save` / `saveBang` layer in their own file.
- [ ] No STI inheritance-column write in `save`.
- [ ] `pnpm parity:api:calls` and `:calls:args` green; persistence, validations, transactions, suppressor and inheritance test files green.
