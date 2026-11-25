---
title: "buttonTo awaits a template block"
status: done
updated: 2026-11-25
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["actionview"]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10720
claim: "2026-11-24T21:01:55Z"
assignee: "button-to-awaits-template-block"
blocked-by: null
closed-reason: null
---

## Context

`buttonTo` with a block (`packages/actionview/lib/helpers/url-helper.ts:182-186`) passes `this.contentTag("button", …, block)` straight to `safeConcat`. A `.tse` template block is compiled `async`, so `contentTag` returns a Promise and `safeConcat` raises `undefined method 'to_str' for an instance of Promise`. Rails: `vendor/rails/v8.0.5.2/actionview/lib/action_view/helpers/url_helper.rb` `button_to`.

The Writebook example (trails#10716) depends on this. A working patch from that branch, with its test:

```diff
diff --git a/packages/actionview/lib/helpers/url-helper.ts b/packages/actionview/lib/helpers/url-helper.ts
index 9df3e9461e..d6197c4492 100644
--- a/packages/actionview/lib/helpers/url-helper.ts
+++ b/packages/actionview/lib/helpers/url-helper.ts
@@ -181,7 +181,7 @@ export async function buttonTo(

   let button: SafeBuffer;
   if (block) {
-    button = this.contentTag("button", htmlOptions, undefined, undefined, block);
+    button = await this.contentTag("button", htmlOptions, undefined, undefined, block);
   } else if (buttonToGeneratesButtonTag) {
     button = this.contentTag("button", rtest(name) ? name : url, htmlOptions);
   } else {
diff --git a/packages/actionview/test/template/url-helper.trails.test.ts b/packages/actionview/test/template/url-helper.trails.test.ts
new file mode 100644
index 0000000000..5a7e5bfc97
--- /dev/null
+++ b/packages/actionview/test/template/url-helper.trails.test.ts
@@ -0,0 +1,30 @@
+import "../support/abstract-unit.js";
+
+import { describe, expect, it } from "vitest";
+import { Base } from "../../lib/base.js";
+import { Template } from "../../lib/template.js";
+
+const renderTse = async (string: string): Promise<string> => {
+  const template = new Template(
+    string.trim(),
+    "test template",
+    Template.handlerForExtension("tse")!,
+    {
+      format: ":html",
+      locals: [],
+    },
+  );
+  const view = Base.withEmptyTemplateCache();
+  return String(await template.render(view.empty(), {})).trim();
+};
+
+describe("UrlHelperTest", () => {
+  it("button to with a template block", async () => {
+    const out = await renderTse(
+      `<%= await buttonTo("http://www.example.com", { authenticity_token: false }, null, () => { %><span>Hello</span><% }) %>`,
+    );
+    expect(out).toBe(
+      '<form class="button_to" method="post" action="http://www.example.com"><button type="submit"><span>Hello</span></button></form>',
+    );
+  });
+});
```

## Acceptance criteria

- `buttonTo` awaits the block's `contentTag`.
- `packages/actionview/test/template/url-helper.trails.test.ts` "button to with a template block" passes, and fails without the fix.
