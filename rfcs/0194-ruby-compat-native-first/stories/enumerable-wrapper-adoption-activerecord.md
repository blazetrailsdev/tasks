---
title: "activerecord: spell Enumerable calls on Sets/Maps as new Enumerable(x).m(...)"
status: in-progress
updated: 2026-10-26
rfc: "0194-ruby-compat-native-first"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: trails#9329
claim: "2026-10-26T14:48:26Z"
assignee: "create-with-value-and-finder-conditions-native-empty"
blocked-by: null
closed-reason: null
---

## Context

trails#9292 made `new Enumerable(x)` (`packages/ruby-compat/src/enumerable.ts`) wrap any Array, Set, Map, generator or `each`-answerer. The call gates credit `new Enumerable(xs).m(...)` as Ruby's `xs.m(...)`: the call set gets `m`, the call-args site gets `xs` as its receiver, and no construction is recorded. In activerecord, a Rails body that calls an `Enumerable` method on a Set, a Hash or a lazy collection is often ported as a spread or `Array.from` followed by a JS array method. That spelling drops the Ruby method name, so the call gates can't credit it.

Candidate sites, found by grepping for `[...x].filter|map|reduce|some|find` and `Array.from(x.values())`. Check each one against its Rails body before converting:

```text
packages/activerecord/src/insert-all.ts:199:    return (this._updatableColumns ??= [...this.keys].filter((k) => !exclude.has(k)));
packages/activerecord/src/insert-all.ts:223:      return [...this.keysIncludingTimestamps()].map((key) => block(key, attributes[key]));
packages/activerecord/src/insert-all.ts:463:    return [...columns].map((column) => this.quoteColumn(column));
packages/activerecord/src/migration.ts:1919:    const [name] = [...groupBy(migrations, (m) => m.name)].find(([, v]) => v.length > 1) ?? [];
packages/activerecord/src/migration.ts:1923:      [...groupBy(migrations, (m) => m.version)].find(([, v]) => v.length > 1) ?? [];
packages/activerecord/src/relation.ts:1483:    return [...new Set(this.includesValues)].filter((spec) => joinsValues.has(spec));
packages/activerecord/src/fixture-set/file.ts:131:    ? [...hash].map(([key, value]) => [String(key), value])
packages/activerecord/src/associations/join-dependency.ts:437:      [...this.joinRoot].map((joinPart, i) => {
packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts:851:    return Array.from(this.columnsHash.values()) as ColumnDefinition[
packages/activerecord/src/support/canonical-schema.ts:1795:    const indexes: IndexSpec[] = [...referenceIndexes, ...builder.indexes].map(
packages/activerecord/src/connection-adapters/schema-cache.ts:612:      [...this._columns].map(([table, columns]) => [
packages/activerecord/src/connection-adapters/schema-cache.ts:720:      [...(value instanceof Map ? value : Object.entries(value))].map(([k, v]) => [
packages/activerecord/src/support/canonical-table-rebuild.ts:11:  const unknown = [...wanted].filter((n) => !known.has(n));
packages/activerecord/src/encryption/encryptable-record.ts:213:      ...new Set([...attributeNames, ...[...klass.encryptedAttributes!].map(String)]),
```

## Acceptance criteria

- [ ] Every site whose Rails body calls an `Enumerable` method on a non-Array receiver is spelled `new Enumerable(x).<railsName>(...)`, or as the free function where the receiver is already an Array.
- [ ] Sites whose Rails body really builds an Array first (`to_a`, `values`) are left alone.
- [ ] `pnpm parity:api:calls` and `parity:api:calls:args` stay green. Delete any baseline row that goes stale and tighten its mark.
