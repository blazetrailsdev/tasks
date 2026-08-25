---
title: "newColumnFromField folds ON UPDATE into the DEFAULT_GENERATED branch Rails does not"
status: done
updated: 2026-08-13
rfc: "0102-adapter-version-reader-fidelity"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6451
claim: "2026-08-13T01:56:51Z"
assignee: "database-version-sync-getter-forces-hand-warms"
blocked-by: null
closed-reason: null
---

## Context

`newColumnFromField` in
`packages/activerecord/src/connection-adapters/mysql/schema-statements.ts:245-258`
folds an `ON UPDATE <expr>` from the `Extra` field into the function-default
string in the **`DEFAULT_GENERATED`** branch:

```ts
const onUpdateMatch = extraRaw.match(/on update (.+)$/i);
...
} else if (meta.extra.toUpperCase().startsWith("DEFAULT_GENERATED")) {
  if (def != null && !def.startsWith("(")) def = `(${def})`;
  let folded = def?.replace(/\\'/g, "'") ?? null;
  if (folded != null && onUpdateMatch) folded = `${folded} ON UPDATE ${onUpdateMatch[1]}`;
  [def, defFn] = [null, folded];
}
```

Rails folds `ON UPDATE` in **only** the datetime/`CURRENT_TIMESTAMP` branch, and
never in the `DEFAULT_GENERATED` branch
(`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql/schema_statements.rb:189-201`):

```ruby
if type_metadata.type == :datetime && /\ACURRENT_TIMESTAMP(?:\([0-6]?\))?\z/i.match?(default)
  default = "#{default} ON UPDATE #{default}" if /on update CURRENT_TIMESTAMP/i.match?(field["Extra"])
  default, default_function = nil, default
elsif type_metadata.extra == "DEFAULT_GENERATED"
  default = +"(#{default})" unless default.start_with?("(")
  default = default.gsub("\\'", "'")
  default, default_function = nil, default
```

Note also that Rails matches `type_metadata.extra == "DEFAULT_GENERATED"`
(exact equality), where trails uses
`meta.extra.toUpperCase().startsWith("DEFAULT_GENERATED")` — so a compound
`"DEFAULT_GENERATED on update CURRENT_TIMESTAMP"` Extra takes the
`DEFAULT_GENERATED` branch in trails and falls through to the later branches in
Rails. The `startsWith` widening and the extra fold are the same invention and
should be assessed together.

Surfaced while shipping `rename-column-for-alter-fallback-arm-is-a-rewrite`
(PR #6228), which removed the only consumer of the related `Column#onUpdate`
attribute (`MySQL::Column` has no `on_update` in Rails —
`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql/column.rb`).
That PR deleted `Column#onUpdate`, `MysqlAddColumnOptions.onUpdate` and the
`ON UPDATE` emission in `MySQL::SchemaCreation#addColumnOptions`, converging the
latter back to Rails' plain `add_sql_comment!(super, options[:comment])`
(`mysql/schema_creation.rb:62-87`). The `DEFAULT_GENERATED` fold above is the
remaining half and was left out as a separate body with its own MySQL-8
behavioural surface.

## Acceptance criteria

- [ ] The `DEFAULT_GENERATED` branch no longer appends `ON UPDATE <expr>` to the
      function-default string; the fold happens only in the datetime /
      `CURRENT_TIMESTAMP` branch, as Rails does.
- [ ] The branch guard is exact equality on `"DEFAULT_GENERATED"`, matching
      `type_metadata.extra == "DEFAULT_GENERATED"`, or the widening is cited as
      language-forced at the call site.
- [ ] `onUpdateMatch` is removed if the datetime branch's own
      `/on update CURRENT_TIMESTAMP/i` test (Rails' guard) is all that remains.
- [ ] MySQL and MariaDB lanes green, including schema-dump round-trips of
      columns with expression defaults and `on update CURRENT_TIMESTAMP`.

## Sweep note (2026-08-12)

Premise re-verified on `main` @ 059bfe688. Line numbers refreshed:
`newColumnFromField` is at
`packages/activerecord/src/connection-adapters/mysql/schema-statements.ts:360`,
the `onUpdateMatch` capture at `:377`, the datetime arm at `:379-381` and the
`DEFAULT_GENERATED` `startsWith` arm with the fold at `:382-390`.

Note the in-code comment at `:383-386` justifies the fold as feeding
`renameColumnForAlter`'s rebuild — PR #6228 is cited in the Context as having
removed the only consumer of `Column#onUpdate`, so check whether that
justification is still true before deciding.
