---
title: "trails-tsc missing-table warning ignores primaryAbstractClass()"
status: claimed
updated: 2026-10-23
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["activerecord-cli"]
deps: []
deps-rfc: []
est-loc: 40
priority: 1
pr: null
claim: "2026-10-23T18:45:53Z"
assignee: "dev-server-exception-pages-answer-static-500"
blocked-by: null
closed-reason: null
---

## Context

Found re-running the root README quickstart on `main` `9a59b3b073` (trails#8195). In a fresh `trails new` app, `pnpm build` (`trails-tsc --schema db/schema.ts`) prints:

```text
trails-tsc: warning: ApplicationRecord (.../app/models/application-record.ts) reads table "application_records", which is in no --schema file; ...
trails-tsc: warning: Post (.../app/models/post.ts) reads table "application_records", which is in no --schema file; ...
```

The generated `ApplicationRecord` is abstract through `static { this.primaryAbstractClass(); }` (Rails' `primary_abstract_class`, `activerecord/lib/active_record/inheritance.rb`, which sets `self.abstract_class = true`). The type-virtualization walker only recognizes `abstractClass = true`: `packages/activerecord-cli/src/type-virtualization/walker.ts:236`. So `missingTables` (`virtualize.ts:50-69`) treats `ApplicationRecord` as concrete, and `baseClassOf` (`virtualize.ts:71-88`) resolves `Post`'s table from `ApplicationRecord` instead of stopping at the abstract class. The warning came in with #8954. `Post` is still typed correctly from `posts`.

## Acceptance criteria

- The walker marks a class abstract for `this.primaryAbstractClass()` in a static block (and the `abstractClass = true` forms it already handles).
- A fresh `trails new` + `generate scaffold` app builds with no missing-table warning.
- A unit test in `type-virtualization` covers the `primaryAbstractClass()` form.
