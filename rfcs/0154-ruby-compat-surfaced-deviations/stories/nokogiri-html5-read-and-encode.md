---
title: "Port Nokogiri::HTML5.read and encode"
status: in-progress
updated: 2026-11-24
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["nokogiri"]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10720
claim: "2026-11-24T21:02:12Z"
assignee: "nokogiri-html5-read-and-encode"
blocked-by: null
closed-reason: null
---

## Context

`Nokogiri::HTML5.read_and_encode` (`vendor/nokogiri/v1.18.3/lib/nokogiri/html5.rb:285-306`) is unported. `DocumentFragment#initialize` and `.parse` and `Document.do_parse` call it, so a non-String input (an IO, a SafeBuffer) reaches parse5 unconverted and fails with `Cannot read properties of undefined (reading 'length')`, e.g. `sanitize(safeBuffer)`. Follow-up for the binary `reencode` arm: story `nokogiri-html5-reencode`.

The Writebook example (trails#10716) depends on this. A working patch from that branch, with its test:

```diff
diff --git a/packages/nokogiri/lib/html5.ts b/packages/nokogiri/lib/html5.ts
new file mode 100644
index 0000000000..6f8cf41121
--- /dev/null
+++ b/packages/nokogiri/lib/html5.ts
@@ -0,0 +1,11 @@
+import { rbObjAsString, rbObjRespondTo } from "@blazetrails/ruby-compat";
+
+/** @internal */
+export function readAndEncode(string: unknown, encoding: string | null): string {
+  if (rbObjRespondTo(string, "read")) {
+    const io = string as { read(options?: { encoding: string }): string | null };
+    return (encoding == null ? io.read() : io.read({ encoding })) ?? "";
+  } else {
+    return rbObjAsString(string);
+  }
+}
diff --git a/packages/nokogiri/lib/html5/document-fragment.ts b/packages/nokogiri/lib/html5/document-fragment.ts
index d7ab83cd95..dd34c7c456 100644
--- a/packages/nokogiri/lib/html5/document-fragment.ts
+++ b/packages/nokogiri/lib/html5/document-fragment.ts
@@ -5,6 +5,7 @@ import { childNodes, Node } from "./node.js";
 import { NodeSet } from "../xml/node-set.js";
 import { DocumentFragment as XmlDocumentFragment } from "../xml/document-fragment.js";
 import { HTML5 } from "../namespaces.js";
+import { readAndEncode } from "../html5.js";

 type Parse5Parent = DefaultTreeAdapterMap["parentNode"];

@@ -21,7 +22,7 @@ export class DocumentFragment extends XmlDocumentFragment {
   /** @missingRailsCall fragment — CONVERGEABLE nokogiri-html5-document-fragment-gumbo-fragment */
   constructor(
     document: Document,
-    input: string | null = null,
+    input: unknown = null,
     context: Node | string | null = null,
     _options: Record<string, unknown> = {},
   ) {
@@ -30,24 +31,27 @@ export class DocumentFragment extends XmlDocumentFragment {
     this.errors = [];
     if (input == null) return;

+    input = readAndEncode(input, null);
+
     if (typeof context === "string") {
       context = new Node(defaultTreeAdapter.createElement(context, html.NS.HTML, []), document);
     }
     (this as { _node: Parse5Parent })._node =
       context !== null && context.isElement()
-        ? parseFragment(context._node as DefaultTreeAdapterMap["element"], input, {})
-        : parseFragment(input);
+        ? parseFragment(context._node as DefaultTreeAdapterMap["element"], input as string, {})
+        : parseFragment(input as string);
   }

   static parse(
-    input: string,
-    _encoding: string | null = null,
+    input: unknown,
+    encoding: string | null = null,
     options: { context?: Node | string | null } = {},
   ): DocumentFragment {
     const { context = null, ...rest } = options;

     const document = new Document();
     document.encoding = "UTF-8";
+    input = readAndEncode(input, encoding);

     return new DocumentFragment(document, input, context, rest);
   }
diff --git a/packages/nokogiri/lib/html5/document.ts b/packages/nokogiri/lib/html5/document.ts
index 10e97370e4..d2e623eecf 100644
--- a/packages/nokogiri/lib/html5/document.ts
+++ b/packages/nokogiri/lib/html5/document.ts
@@ -1,7 +1,8 @@
 import { defaultTreeAdapter, html, parse, type DefaultTreeAdapterMap } from "parse5";
 import { ArgumentError, rbObjRespondTo } from "@blazetrails/ruby-compat";

-import { readSource, type Readable } from "../readable.js";
+import type { Readable } from "../readable.js";
+import { readAndEncode } from "../html5.js";
 import { childNodes, Node } from "./node.js";
 import { DocumentFragment } from "./document-fragment.js";
 import { HTML5 } from "../namespaces.js";
@@ -34,14 +35,9 @@ export class Document extends Node {
     options: Record<string, unknown> = {},
     block?: (options: Record<string, unknown>) => void,
   ): Document {
-    ({
-      url = url,
-      encoding = encoding,
-      ...options
-    } = options as {
-      url?: string | null;
-      encoding?: string | null;
-    });
+    const kwargs: { url?: string | null; encoding?: string | null } & Record<string, unknown> =
+      options;
+    ({ url = url, encoding = encoding, ...options } = kwargs);
     if (block) block(options);
     if (stringOrIo == null) stringOrIo = "";

@@ -61,10 +57,10 @@ export class Document extends Node {
   private static doParse(
     stringOrIo: string | Readable,
     url: string | null,
-    _encoding: string | null,
+    encoding: string | null,
     _options: Record<string, unknown>,
   ): Document {
-    const string = readSource(stringOrIo);
+    const string = readAndEncode(stringOrIo, encoding);

     const doc = new Document(parse(string));
     doc.url = url;
diff --git a/packages/nokogiri/test/html5/read-and-encode.trails.test.ts b/packages/nokogiri/test/html5/read-and-encode.trails.test.ts
new file mode 100644
index 0000000000..ce728d1135
--- /dev/null
+++ b/packages/nokogiri/test/html5/read-and-encode.trails.test.ts
@@ -0,0 +1,21 @@
+import { describe, expect, it } from "vitest";
+
+import { DocumentFragment } from "../../lib/html5/document-fragment.js";
+
+describe("Nokogiri::HTML5.read_and_encode", () => {
+  it("parses a fragment from an object's to_s", () => {
+    class Markup {
+      toS(): string {
+        return "<b>bold</b>";
+      }
+    }
+    const fragment = DocumentFragment.parse(new Markup());
+    expect(fragment.toHtml()).toBe("<b>bold</b>");
+  });
+
+  it("parses a fragment from an IO's read", () => {
+    const io = { read: () => "<i>read</i>" };
+    const fragment = DocumentFragment.parse(io);
+    expect(fragment.toHtml()).toBe("<i>read</i>");
+  });
+});
```

## Acceptance criteria

- `readAndEncode` is ported (its `read` and `to_s` arms) and called at its three Ruby call sites.
- `packages/nokogiri/test/html5/read-and-encode.trails.test.ts` passes.
