---
title: "ForeignKeyDefinition stores flat fields where Rails' Struct stores only the options hash"
status: claimed
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: "2026-09-05T19:46:50Z"
assignee: "rack-deflater-call-diverges-from-rails-case-arms"
blocked-by: null
closed-reason: null
---

## Context

Rails' `ForeignKeyDefinition` is
`Struct.new(:from_table, :to_table, :options)`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:123`).
The options hash is the ONLY stored state; every reader derives from it:

```ruby
def name;        options[:name];        end   # :124-126
def column;      options[:column];      end   # :128-130
def primary_key; options[:primary_key] || default_primary_key; end  # :132-134
def on_delete;   options[:on_delete];   end   # :136-138
def on_update;   options[:on_update];   end   # :140-142
def deferrable;  options[:deferrable];  end   # :144-146
def custom_primary_key?; options[:primary_key] != default_primary_key; end  # :148-150
def validate?;   options.fetch(:validate, true); end  # :152-154
```

trails inverts this: `packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts`
stores `column`, `primaryKey`, `name`, `onDelete`, `onUpdate`, `deferrable`,
`validate` as flat readonly fields, plus two members Rails does not have —
`storesValidate` and `storedOptionKeys`, both carrying
`@noRailsEquivalent PERMANENT` — that exist purely to reconstruct "which keys
were actually passed", which Rails gets for free from the hash's own key set.

PR #7288 added the `options` member itself (it is needed by SQLite's
`remove_foreign_key`, which does `options.slice(*fk.options.keys)`,
`sqlite3/schema_statements.rb:79`), but built it FROM the flat fields rather
than the other way round. So the hash and the fields are now two
representations of one thing, and `storedOptionKeys` is the seam between them.

Note `primary_key` and `custom_primary_key?` read `options[:primary_key]`
directly — NOT the `primary_key` reader — so `custom_primary_key?` is false for
a definition that never passed `:primary_key`, where trails' `isCustomPrimaryKey`
compares the already-defaulted field against `defaultPrimaryKey` and is
therefore always false. That is a live behavioural difference, not just shape.

## Converged shape

Store the options hash as the single source of truth, constructor-assigned, and
make every reader derive from it exactly as the Ruby does — including
`primaryKey`'s `|| defaultPrimaryKey`, `isCustomPrimaryKey`'s direct
`options[:primary_key]` read, and `isValidate`'s `options.fetch(:validate, true)`
(a `fetch`, not `??` — a stored `null`/`false` must survive, see
[[project_ruby_fetch_nil_presence_vs_js_nullish]]).

`storesValidate` and `storedOptionKeys` then have nothing left to express and
both `@noRailsEquivalent PERMANENT` receipts come off with them.

The constructor currently takes nine positional parameters; Rails takes
`(from_table, to_table, options)`. Converging the signature is part of this
story — check every construction site (`newForeignKeyDefinition` in the same
file, each adapter's `foreignKeys()`, `SchemaDumper`) before starting.

## Acceptance criteria

- [ ] `ForeignKeyDefinition` stores `fromTable`, `toTable`, `options` and
      nothing else; every reader derives from `options` at the Rails line cited
      above.
- [ ] `isCustomPrimaryKey` reads the raw option, so it is false when
      `:primary_key` was never passed.
- [ ] `isValidate` uses Ruby `fetch` semantics, not `??`.
- [ ] The `storesValidate` and `storedOptionKeys` `@noRailsEquivalent PERMANENT`
      receipts are deleted, not re-justified.
- [ ] The constructor takes Rails' three parameters.
- [ ] `foreign-key.test.ts`, `schema-dumper.test.ts` and the adapter
      `foreignKeys()` suites stay green on all three adapters.
