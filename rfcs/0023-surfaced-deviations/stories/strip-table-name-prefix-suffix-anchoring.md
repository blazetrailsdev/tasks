---
title: "Match Rails' unanchored strip_table_name_prefix_and_suffix regex"
status: draft
updated: 2026-07-28
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`strip_table_name_prefix_and_suffix` and `remove_prefix_and_suffix` are two
different regexes in Rails, and trails ported the wrong semantics into one of
them.

Rails, `schema_statements.rb:1749-1753` — **unanchored, unescaped**:

```ruby
def strip_table_name_prefix_and_suffix(table_name)
  prefix = Base.table_name_prefix
  suffix = Base.table_name_suffix
  table_name.to_s =~ /#{prefix}(.+)#{suffix}/ ? $1 : table_name.to_s
end
```

Rails, `schema_dumper.rb:366-374` — **anchored and escaped**:

```ruby
table.sub(/\A#{prefix}(.+)#{suffix}\z/, "\\1")
```

trails' `stripTableNamePrefixAndSuffix`
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:2420-2431`)
anchors with `^...$`, i.e. it reproduces the dumper's regex at the site that
ports the schema_statements one. Same for the `columnFor` fallback in
`TableDefinition#_foreignKeyOptions`
(`connection-adapters/abstract/schema-definitions.ts`).

Divergence with `Base.tableNamePrefix = "p_"` and table `app_dogs`:

- Rails: `/p_(.+)/` matches at index 2, `$1` = `dogs`.
- trails: `/^p_(.+)$/` does not match, returns `app_dogs` unchanged.

This became reachable in #5453 / #5488, which wired the live
`Base.tableNamePrefix` through the `table-name-options` registry; before that
both sites read `adapter.tableNamePrefix`, which nothing populated, so prefix
was always `""` and the branch was dead.

**Overlaps with `strip-table-name-prefix-suffix-regex-escaping`** — triage
should reconcile the two. That story's acceptance criterion ("both unescaped
sites escape prefix and suffix ... matching Rails' `Regexp.escape`") overreaches
for the schema_statements site: Rails escapes only in the dumper, so escaping
`stripTableNamePrefixAndSuffix` would itself be a deviation. Fidelity means
anchored+escaped in the dumper, unanchored+unescaped in schema_statements.

## Acceptance criteria

- [ ] `stripTableNamePrefixAndSuffix` matches Rails' unanchored
      `/#{prefix}(.+)#{suffix}/`, including the `$1`-vs-original fallback.
- [ ] The `columnFor` fallback in `_foreignKeyOptions` uses the same semantics
      as whichever Rails method it actually ports.
- [ ] A regression test covers a table whose name contains the prefix
      mid-string (`p_` in `app_dogs`); it fails on the current anchored
      implementation.
- [ ] Reconciled with `strip-table-name-prefix-suffix-regex-escaping` so the
      two do not prescribe conflicting regexes for the same function.
