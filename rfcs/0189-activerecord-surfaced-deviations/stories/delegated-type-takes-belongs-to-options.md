---
title: "delegated type accepts belongs to options"
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
claim: "2026-11-24T21:02:02Z"
assignee: "delegated-type-takes-belongs-to-options"
blocked-by: null
closed-reason: null
---

## Context

`delegated_type(role, types:, **options)` forwards every option to `belongs_to` (`vendor/rails/v8.0.5.2/activerecord/lib/active_record/delegated_type.rb:231-234`). trails' `DelegatedTypeOptions` (`packages/activerecord/lib/delegated-type.ts:5-11`) types only `scope`/`foreignKey`/`foreignType`/`primaryKey`, so `delegatedType("leafable", { types, dependent: "destroy" })` does not typecheck.

The Writebook example (trails#10716) depends on this. A working patch from that branch, with its test:

```diff
diff --git a/packages/activerecord/lib/delegated-type.ts b/packages/activerecord/lib/delegated-type.ts
index 3b4916ac49..9294638985 100644
--- a/packages/activerecord/lib/delegated-type.ts
+++ b/packages/activerecord/lib/delegated-type.ts
@@ -1,8 +1,9 @@
 import type { Base } from "./base.js";
+import type { AssociationOptions } from "./associations.js";
 import { camelize, constantize, inquiry, singularize, tableize } from "@blazetrails/activesupport";
 import { hashDelete, rbFSend, rbClearMethodCache } from "@blazetrails/ruby-compat";

-export interface DelegatedTypeOptions {
+export interface DelegatedTypeOptions extends Omit<AssociationOptions, "scope"> {
   types: string[];
   scope?: (rel: any, owner?: any) => any;
   foreignKey?: string;
```

## Acceptance criteria

- `DelegatedTypeOptions` accepts the belongs_to options (`dependent`, `touch`, …).
