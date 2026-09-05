---
title: "Index include: collapses Rails' Symbol/String/Array arms into one raw-passthrough"
status: claimed
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-09-05T20:46:47Z"
assignee: "convert-time-to-time-zone-guard-is-an-instanceof-list"
blocked-by: null
closed-reason: null
---

## Context

Rails' index `include:` option takes a Symbol, a String, or an Array, and the
three arms are NOT equivalent —
`postgresql/schema_creation.rb:143-145`:

```ruby
def quoted_include_columns(o)
  String === o ? o : quoted_include_columns_for_index(o)
end
```

A String passes through RAW (it is treated as a SQL fragment); a Symbol or an
Array is quoted, via `quoted_include_columns_for_index`
(`postgresql/schema_statements.rb:944-951`), whose own first line is
`return quote_column_name(column_names) if column_names.is_a?(Symbol)`.

trails collapses the discrimination. `quotedIncludeColumns`
(`packages/activerecord/src/connection-adapters/abstract/schema-creation.ts:103-106`)
is:

```ts
if (typeof o === "string") return o;
return o.map((c) => this.conn.quoteColumnName(c)).join(", ");
```

A Ruby Symbol is a JS string in trails, so the Symbol arm and the String arm
are indistinguishable here and both take the raw-passthrough branch. Rails'
`add_index(t, c, include: :foo)` emits `INCLUDE ("foo")`; ours emits
`INCLUDE (foo)`.

The single-value arm is not even expressible through the typed API:
`AddIndexOptions.include` and `IndexDefinition.include` are both `string[]`
(`abstract/schema-definitions.ts:442`, `:475`), so
`migration/index_test.rb`'s `include: :foo` had to be ported as
`include: ["foo"]` (`packages/activerecord/src/migration/index.test.ts`,
PR #7245). That array spelling happens to produce the same SQL as Rails'
Symbol arm, which is why the ported tests pass and the divergence stayed
hidden.

## Converged shape

Per CLAUDE.md's Symbol rule, a Ruby Symbol whose type is the discriminator
keeps its leading colon in the string: `":foo"`, with `.slice(1)` for the name.
Widen `include` to `string | string[]` on both `AddIndexOptions` and
`IndexDefinition`, and give `quotedIncludeColumns` the three arms Rails has —
colon-prefixed string (Symbol) quoted, bare string passed through raw, array
quoted and joined — mirroring `schema_creation.rb:143-145` and
`schema_statements.rb:944-951`.

Check `defined_for?`'s include comparison alongside it
(`schema_definitions.rb:60`, `Array(self.include) == Array(include).map(&:to_s)`):
once a single value is expressible, `IndexDefinition#isDefinedFor`'s `array()`
helper must wrap it the way `Array()` does, which it already would — but the
colon-prefixed spelling needs stripping before the comparison.

## Acceptance criteria

- `include:` accepts a single value and an array on both types.
- The Symbol, String and Array arms each produce the SQL their Rails
  counterpart does; a test covers the Symbol-vs-String difference specifically
  (they must NOT produce the same SQL).
- `index_exists?(..., include: <single value>)` matches the way
  `defined_for?` does.
- `pnpm parity:api:calls` / `:calls:args` stay green; PG lane passes.
