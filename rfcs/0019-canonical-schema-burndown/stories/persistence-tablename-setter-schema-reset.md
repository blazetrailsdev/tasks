---
title: "persistence-tablename-setter-schema-reset"
status: ready
updated: 2026-06-27
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

When Rails' `table_name=` is called on a class in a connected context, it calls `reset_column_information`, which forces re-reflection of the new table's schema. Trails' `tableName` setter (model-schema.ts) only resets `_predicateBuilder` and `_findByStatementCache`, not `_schemaLoaded` or the column definitions.

This causes a failure in `test_persist_inherited_class_with_different_table_name` (persistence_test.rb:1451): a `Class.new(Minimalistic) { self.table_name = "aircraft" }` subclass inherits `Minimalistic._schemaLoaded = true` (empty minimalistic schema) via the prototype chain and never re-reflects the aircraft table. The attribute accessors end up as Null type, so `aircraft.name = "Wright Glider"` throws `MissingAttributeError: can't write unknown attribute 'name'`.

Rails fix: in `tableName` setter, when the table name changes, also clear `_schemaLoaded` on the class (shadow it with `false` if needed to override inherited `true`).

After fixing, `test_persist_inherited_class_with_different_table_name` can be ported in `persistence-test-canonical-wave16`:

```ts
class MinimalisticAircrafts extends Minimalistic {
  static {
    this.tableName = "aircraft";
  }
}
const before = Number(await Aircraft.count());
const aircraft = await MinimalisticAircrafts.create({ name: "Wright Flyer" });
aircraft.name = "Wright Glider";
await aircraft.save();
expect(Number(await Aircraft.count())).toBe(before + 1);
expect(((await Aircraft.last()) as any).name).toBe("Wright Glider");
```

## Acceptance criteria

- [ ] `tableName` setter in model-schema.ts: when table name changes on a class that has `_schemaLoaded` (own or inherited), set `_schemaLoaded = false` on the class itself to force re-reflection on next load.
- [ ] `pnpm vitest run packages/activerecord/src/model-schema.test.ts` passes.
- [ ] `test_persist_inherited_class_with_different_table_name` can be ported without workaround.
