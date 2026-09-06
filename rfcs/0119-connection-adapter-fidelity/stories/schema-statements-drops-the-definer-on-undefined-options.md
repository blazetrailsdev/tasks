---
title: "schema-statements-drops-the-definer-on-undefined-options"
status: in-progress
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 7546
claim: "2026-09-05T23:56:22Z"
assignee: "converge-pg-native-types-and-instance-type-map-onto-adapter"
blocked-by: null
closed-reason: null
---

## Context

`SchemaStatements#createTable` reads the table definer off its second argument:

    if (typeof options === "function") {
      definer = options;
    } else if (options) {
      kwargs = options;
      definer = fn;
    }

(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:232-237`.)
An explicitly-passed `options === undefined` falls through both arms, so
`definer` stays undefined and the block is silently DROPPED — the table is
created with no columns and no error. `changeTable` and `createJoinTable`
carry the same shape.

Ruby has no such hole: `create_table(table_name, **options)` takes the block
separately from the kwargs, and `block_given?`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:302-329`)
is true whether or not any keyword was passed.

Surfaced in PR #7382 review: `Migration::Current`'s overrides forwarded
`super.createTable(tableName, undefined, block)` and lost the block. That PR
fixed the CALLER — `Current` now routes `options === undefined` through the
callback-as-second-argument form — but the hole itself is still there, and
`Migration`'s own delegators (`migration.ts:368`, `:397`, `:786`, `:819`) reach
it the same way: `migration.createTable(name, undefined, fn)` drops the block
today.

## Converged shape

Treat the second argument as the definer whenever it is a function, and take
`fn` as the definer whenever it is present — a kwargs slot holding `undefined`
means "no keywords", never "no block":

    if (typeof options === "function") {
      definer = options;
    } else {
      kwargs = options ?? {};
      definer = fn;
    }

Apply to all three methods, and drop the caller-side `options === undefined`
special case PR #7382 added to `Current` once the sink is honest.

## Acceptance criteria

- [ ] `createTable(name, undefined, fn)` runs `fn`, and so do the `changeTable`
      and `createJoinTable` equivalents.
- [ ] `Migration`'s four delegators pass a block through with `options`
      omitted.
- [ ] `Current`'s three overrides lose the `options === undefined` arm, leaving
      Rails' two branches.
- [ ] A test pins each of the three, failing on the current sink.
