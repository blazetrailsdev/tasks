---
title: "quote and type cast a SafeBuffer as a String"
status: in-progress
updated: 2026-11-24
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10720
claim: "2026-11-24T21:01:58Z"
assignee: "quote-safe-buffer-as-string"
blocked-by: null
closed-reason: null
---

## Context

Rails' `Quoting#quote` / `#type_cast` treat an `ActiveSupport::SafeBuffer` as the String it is (`when String`, `vendor/rails/v8.0.5.2/activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:73-89`). trails' `quote` raises `can't quote ActiveSupport::SafeBuffer` (`packages/activerecord/lib/connection-adapters/abstract/quoting.ts:87-120`), e.g. binding `htmlEscape(...)` through `sanitize_sql`.

The Writebook example (trails#10716) depends on this. A working patch from that branch, with its test:

```diff
diff --git a/packages/activerecord/lib/connection-adapters/abstract/quoting.ts b/packages/activerecord/lib/connection-adapters/abstract/quoting.ts
index cefcca9986..d81306a6dd 100644
--- a/packages/activerecord/lib/connection-adapters/abstract/quoting.ts
+++ b/packages/activerecord/lib/connection-adapters/abstract/quoting.ts
@@ -18,7 +18,7 @@
  */

 import { DateTime, Time as RubyTime } from "@blazetrails/date";
-import { actsLike, BigDecimal, Chars, TimeWithZone } from "@blazetrails/activesupport";
+import { actsLike, BigDecimal, Chars, SafeBuffer, TimeWithZone } from "@blazetrails/activesupport";
 import { Attribute as ModelAttribute, BinaryData, type ValueType } from "@blazetrails/activemodel";
 import {
   rbFSend,
@@ -85,7 +85,7 @@ export type TemporalDateLike =
   | Temporal.PlainDate;

 export function quote(this: QuotingDispatchHost, value: unknown): string {
-  if (typeof value === "string" || value instanceof Chars) {
+  if (typeof value === "string" || value instanceof SafeBuffer || value instanceof Chars) {
     return `'${this.quoteString(rbObjAsString(value))}'`;
   }
   if (value === true) return this.quotedTrue();
@@ -120,7 +120,9 @@ export function quote(this: QuotingDispatchHost, value: unknown): string {
 }

 export function typeCast(this: QuotingDispatchHost, value: unknown): unknown {
-  if (value instanceof Chars || value instanceof BinaryData) return rbObjAsString(value);
+  if (value instanceof SafeBuffer || value instanceof Chars || value instanceof BinaryData) {
+    return rbObjAsString(value);
+  }
   if (value === true) return this.unquotedTrue();
   if (value === false) return this.unquotedFalse();
   if (value instanceof BigDecimal) return value.toString("F");
diff --git a/packages/activerecord/test/cases/quoting.trails.test.ts b/packages/activerecord/test/cases/quoting.trails.test.ts
index 669c167927..99e9f03939 100644
--- a/packages/activerecord/test/cases/quoting.trails.test.ts
+++ b/packages/activerecord/test/cases/quoting.trails.test.ts
@@ -1,6 +1,6 @@
 import { describe, it, expect } from "vitest";
 import { BinaryData } from "@blazetrails/activemodel";
-import { Chars } from "@blazetrails/activesupport";
+import { Chars, htmlSafe } from "@blazetrails/activesupport";
 import { Time as RubyTime } from "@blazetrails/date";
 import { quotingHost } from "../support/quoting-host.js";
 import {
@@ -10,6 +10,7 @@ import {
   unquotedTrue,
   unquotedFalse,
   quotedBinary,
+  quote,
   typeCast,
   castBoundValue,
   sanitizeAsSqlComment,
@@ -20,6 +21,14 @@ import { NotImplementedError } from "../../lib/errors.js";
 const HOST = quotingHost();

 describe("QuotingTest (trails)", () => {
+  it("quotes an ActiveSupport::SafeBuffer as the String it is", () => {
+    expect(quote.call(HOST, htmlSafe("it's"))).toBe("'it''s'");
+  });
+
+  it("type casts an ActiveSupport::SafeBuffer to its string", () => {
+    expect(typeCast.call(HOST, htmlSafe("<b>"))).toBe("<b>");
+  });
+
   it("quote table name for assignment", () => {
     expect(() => quoteTableNameForAssignment.call(HOST, "users", "name")).toThrow(
       NotImplementedError,
```

## Acceptance criteria

- `quote` and `typeCast` take the String arm for a SafeBuffer.
- Two quoting tests pass and fail without the fix.
