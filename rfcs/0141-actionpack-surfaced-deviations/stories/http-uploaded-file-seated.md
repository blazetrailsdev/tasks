---
title: "Seat ActionDispatch::Http::UploadedFile"
status: draft
updated: 2026-11-24
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Http::UploadedFile` (`vendor/rails/v8.0.5.2/actionpack/lib/action_dispatch.rb`, `module Http; autoload :UploadedFile`) is not seated on trails' `Http` namespace (`packages/actionpack/lib/namespaces.ts:159-167`), so `value instanceof ActionDispatch.Http.UploadedFile` throws.

The Writebook example (trails#10716) depends on this. A working patch from that branch, with its test:

```diff
diff --git a/packages/actionpack/lib/namespaces.ts b/packages/actionpack/lib/namespaces.ts
index 9f83ee690b..9773705074 100644
--- a/packages/actionpack/lib/namespaces.ts
+++ b/packages/actionpack/lib/namespaces.ts
@@ -12,6 +12,7 @@ import { Base, DetailsKey, Template } from "@blazetrails/actionview";
 import { Mime, MimeType } from "./action-dispatch/http/mime-type.js";
 import * as Journey from "./action-dispatch/journey/index.js";
 import * as Cache from "./action-dispatch/http/cache.js";
+import { UploadedFile } from "./action-dispatch/http/upload.js";
 import type * as PageDumpHelper from "./action-dispatch/testing/test-helpers/page-dump-helper.js";
 import * as ActionPackGemVersion from "./action-pack/gem-version.js";
 import type { Base as ControllerBase } from "./action-controller/base.js";
@@ -162,8 +163,10 @@ export const Http = { name: "ActionDispatch::Http" } as {
   FilterParameters: typeof import("./action-dispatch/http/filter-parameters.js");
   Parameters: typeof HttpParameters;
   Cache: typeof Cache;
+  UploadedFile: typeof UploadedFile;
 };
 Http.Cache = Cache;
+Http.UploadedFile = UploadedFile;
 ActionDispatch.Http = Http;
 ActionDispatch.Journey = Journey;
 ActionDispatch.Constants = Constants;
diff --git a/packages/actionpack/test/action-dispatch/dispatch/uploaded-file.trails.test.ts b/packages/actionpack/test/action-dispatch/dispatch/uploaded-file.trails.test.ts
index 04f5918b9c..bf88b9c12f 100644
--- a/packages/actionpack/test/action-dispatch/dispatch/uploaded-file.trails.test.ts
+++ b/packages/actionpack/test/action-dispatch/dispatch/uploaded-file.trails.test.ts
@@ -2,6 +2,7 @@ import { b, Tempfile } from "@blazetrails/ruby-compat";
 import { describe, expect, it } from "vitest";

 import { UploadedFile } from "../../../lib/action-dispatch/http/upload.js";
+import { ActionDispatch } from "../../../lib/index.js";

 describe("ActionDispatch::Http::UploadedFile", () => {
   it("read answers null at EOF and rewind starts the stream over", () => {
@@ -28,4 +29,8 @@ describe("ActionDispatch::Http::UploadedFile", () => {
     expect(file.read(5, buffer)).toEqual(b("hello"));
     expect(String.fromCharCode(...buffer)).toBe("hello");
   });
+
+  it("is seated on the ActionDispatch::Http namespace", () => {
+    expect(ActionDispatch.Http.UploadedFile).toBe(UploadedFile);
+  });
 });
```

## Acceptance criteria

- `ActionDispatch.Http.UploadedFile` is the class from `action-dispatch/http/upload.ts`, with a test.
