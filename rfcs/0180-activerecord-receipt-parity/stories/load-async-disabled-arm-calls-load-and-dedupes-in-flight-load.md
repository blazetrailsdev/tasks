---
title: "activerecord: Relation#load_async calls load in its disabled arm and dedupes an in-flight load"
status: ready
updated: 2026-10-07
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8299 (red-105dd575) fixed the `:memory:` lane red. `Relation#loadAsync` had dropped Rails' `return load if !c.async_enabled?` arm (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb:1138-1141`), so a disabled-async relation read as `scheduled?`. #8299 parks that arm's query in a new `@internal _loadResult` field. `isScheduled` stays `!!@future_result` (`relation.rb:1169-1171`). `inspect`, `ids`, `excluding`, `Delegation`'s `withRecords` and the ClassSpecificRelation Proxy's enumerable arm check `isScheduled || _loadResult` before reading `_records` synchronously.

Review on #8299 left four items open. They were deferred so the unblocking CI run could finish:

1. **Port the arm literally.** `loadAsync` still runs `execMainQuery(false)` and parks the promise, where Rails calls `load` before `unless loaded?`. Converge by calling `this.load()` in the `!asyncEnabled` arm, setting `_loaded = true`, and returning. That also retires `@missingRailsCall load — PERMANENT` on `loadAsync`. The async arm then passes `!c.currentTransaction().joinable` as Rails does (`:1143`).
2. **Clearing window / duplicate query.** `execQueries` clears `_loadResult` / `_futureResult` only after `await ensureSchemaLoaded()` / `_materializeDeferredDistinctPkPredicates()`. So two concurrent `load()`s (for example `Promise.all([rel.length(), rel.map(...)])` on a scheduled relation) both enter `execQueries`, and the second re-runs `execMainQuery()`. Also, while the first drain is in flight, a sync reader sees `isLoaded && !isScheduled && !_loadResult` and reads empty `_records`. Fix: make `_loadResult` the in-flight `load()` promise for both arms. `load()` awaits it if set; otherwise it assigns `withConnection(() => execQueries(block))` to it before the first await and clears it in `finally` (only if still identical). Then the `_loadResult` branch in `execQueries` goes away.
3. **Numeric-index Proxy arm** (`relation.ts`, `target._records[n]`) still reads empty `_records` on a pending relation. Route it through `records().then(r => r[n])` when pending, as the enumerable arm does.
4. **`inspect` shape.** Keep Rails' `subject = loaded? ? records : annotate("loading for inspect")` then `entries = subject.take(...)` flow (`relation.rb:1290-1295`) in one continuation. The current arrow is named `entries`, which is Rails' name for the inspected array.

A local implementation of 1-4, which passed `relation/`, `relation.test.ts`, `null-relation.test.ts` and both load-async test files on the default and `ARCONN=sqlite3_mem` lanes, is below. Before shipping, run a wider sample: `load()` changes touch every relation load.

```diff
diff --git a/packages/activerecord/src/relation-load-async.trails.test.ts b/packages/activerecord/src/relation-load-async.trails.test.ts
index c3e5c5252d..4672b44afa 100644
--- a/packages/activerecord/src/relation-load-async.trails.test.ts
+++ b/packages/activerecord/src/relation-load-async.trails.test.ts
@@ -215,8 +215,16 @@ describe("Relation#load_async", () => {
       length(): number | Promise<number>;
       map(fn: (topic: { title: string }) => string): string[] | Promise<string[]>;
       inspect(): string | Promise<string>;
+      0: unknown;
     };

+    const [length, titles] = await Promise.all([
+      relation.length(),
+      relation.map((topic) => topic.title),
+    ]);
+    expect(length).toBe(1);
+    expect(titles).toEqual(["delegated async topic"]);
+    expect(((await relation[0]) as { title: string }).title).toBe("delegated async topic");
     expect(await relation.length()).toBe(1);
     expect(await relation.map((topic) => topic.title)).toEqual(["delegated async topic"]);
     expect(await relation.inspect()).toContain("delegated async topic");
diff --git a/packages/activerecord/src/relation.ts b/packages/activerecord/src/relation.ts
index 81b934c5dd..eacf4fa18c 100644
--- a/packages/activerecord/src/relation.ts
+++ b/packages/activerecord/src/relation.ts
@@ -337,7 +337,7 @@ export class Relation<T extends Base> {
   protected _offsets?: Map<number, T | null>;
   private _futureResult?: FutureResult | Complete | Promise<Result>;
   /** @internal */
-  _loadResult?: Promise<Result>;
+  _loadResult?: Promise<unknown>;
   private _loadToken = 0;

   private _joinDependency: JoinDependency | null = null;
@@ -369,7 +369,9 @@ export class Relation<T extends Base> {
             return value;
           }
           if (/^(0|[1-9]\d*)$/.test(prop)) {
-            return (target.target ?? target._records)[Number(prop)];
+            return target.isLoaded && !target.isScheduled && !target._loadResult
+              ? (target.target ?? target._records)[Number(prop)]
+              : target.records().then((records: T[]) => records[Number(prop)]);
           }
           const enumerable = ENUMERABLE_METHODS[prop];
           if (enumerable) {
@@ -394,21 +396,20 @@ export class Relation<T extends Base> {
   }

   inspect(): string | Promise<string> {
-    const inspectEntries = (subject: T[]): string => {
-      const entries = subject.map((record) => record.inspect());
+    const limit = min(compact([this.limitValue, 11])) as number;
+    const subject: T[] | Promise<T[]> = this.isLoaded
+      ? this.isScheduled || this._loadResult
+        ? this.records()
+        : this._records
+      : this.annotate("loading for inspect").take(limit);
+    const inspectSubject = (subject: T[]): string => {
+      const entries = subject.slice(0, limit).map((record) => record.inspect());
+
       if (entries.length === 11) entries[10] = "...";
+
       return `#<${(this.constructor as typeof Relation)._railsClassName} [${entries.join(", ")}]>`;
     };
-    if (this.isLoaded) {
-      const entries = (records: T[]): string =>
-        inspectEntries(records.slice(0, min(compact([this.limitValue, 11])) as number));
-      return this.isScheduled || this._loadResult
-        ? this.records().then(entries)
-        : entries(this._records);
-    }
-    return this.annotate("loading for inspect")
-      .take(min(compact([this.limitValue, 11])) as number)
-      .then(inspectEntries);
+    return subject instanceof Promise ? subject.then(inspectSubject) : inspectSubject(subject);
   }

   async prettyPrint(pp: PrettyPrinter): Promise<void> {
@@ -466,21 +467,22 @@ export class Relation<T extends Base> {
     return this._records;
   }

-  /**
-   * @missingRailsCall with_connection — CONVERGEABLE sync-reads-of-async-reflection-retire-with-rfc-0073
-   * @missingRailsCall load — PERMANENT
-   */
+  /** @missingRailsCall with_connection — CONVERGEABLE sync-reads-of-async-reflection-retire-with-rfc-0073 */
   loadAsync(): Relation<T> {
     this._model.connectionPool().withConnectionSync((c: DatabaseAdapter) => {
+      if (c.asyncEnabled?.() !== true) {
+        void this.load().catch(() => {});
+        this._loaded = true;
+        return;
+      }
+
       if (!this.isLoaded) {
-        const asyncEnabled = c.asyncEnabled?.() === true;
-        const result = this.execMainQuery(asyncEnabled && !c.currentTransaction().joinable);
+        const result = this.execMainQuery(!c.currentTransaction().joinable);
         if (result instanceof Result) {
           this.loadRecords(this.instantiateRecords(result));
         } else {
           if (result instanceof Promise) void result.catch(() => {});
-          if (asyncEnabled) this._futureResult = result;
-          else this._loadResult = result as Promise<Result>;
+          this._futureResult = result;
         }
         this._loaded = true;
       }
@@ -632,9 +634,17 @@ export class Relation<T extends Base> {
   }

   async load(block?: (record: T) => void): Promise<LoadedRelation<this>> {
-    if (!this.isLoaded || this.isScheduled || this._loadResult) {
+    if (this._loadResult) await this._loadResult;
+    if (!this.isLoaded || this.isScheduled) {
       const token = this._loadToken;
-      const records = await this.withConnection(() => this.execQueries(block));
+      const loadResult = this.withConnection(() => this.execQueries(block));
+      this._loadResult = loadResult;
+      let records: T[];
+      try {
+        records = await loadResult;
+      } finally {
+        if (this._loadResult === loadResult) this._loadResult = undefined;
+      }
       if (token === this._loadToken) this.loadRecords(records);
     }
     return stripThenable(this);
@@ -659,10 +669,6 @@ export class Relation<T extends Base> {
         const future = this._futureResult!;
         this._futureResult = undefined;
         rows = await (future instanceof FutureResult ? future.result() : future);
-      } else if (this._loadResult) {
-        const loadResult = this._loadResult;
-        this._loadResult = undefined;
-        rows = await loadResult;
       } else {
         rows = await this.execMainQuery();
       }
```

## Acceptance criteria

- `loadAsync`'s `!asyncEnabled` arm calls `load` (Rails `relation.rb:1140`), and the `@missingRailsCall load — PERMANENT` receipt is removed.
- Concurrent `load()` calls on a scheduled or pending relation issue exactly one query. The trails test "drains the pending query from the delegated record readers and inspect" asserts `Promise.all([length(), map()])` plus `rel[0]` with `selectAll` called once, on both the default and `:memory:` lanes.
- No sync reader returns empty `_records` while a load is in flight: the Proxy index arm, the enumerable arm, `withRecords`, `inspect`, `ids`.
- `inspect` follows Rails' `subject` / `entries` flow.
- `parity:api:calls`, `parity:api:calls:args` and `parity:api:extra:gate` are green.
