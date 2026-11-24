---
title: "Port active record.set signed id verifier secret"
status: draft
updated: 2026-11-24
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
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

Rails' `active_record.set_signed_id_verifier_secret` initializer (`vendor/rails/v8.0.5.2/activerecord/lib/active_record/railtie.rb:322-326`) is not ported in `packages/trailties/lib/trailties/active-record.ts`, so `signed_id` / `find_signed` raise "You must set ActiveRecord::Base.signed_id_verifier_secret" in an app. The secret is key-generator bytes, so `signedIdVerifierSecret` must also accept a `Uint8Array`.

The Writebook example (trails#10716) depends on this. A working patch from that branch, with its test:

```diff
diff --git a/packages/activerecord/lib/base.ts b/packages/activerecord/lib/base.ts
index 1ce4f5d333..2d11975a17 100644
--- a/packages/activerecord/lib/base.ts
+++ b/packages/activerecord/lib/base.ts
@@ -431,7 +431,8 @@ export class Base extends Model {

   declare static signedIdVerifierSecret:
     | string
-    | (() => string | null | undefined)
+    | Uint8Array
+    | (() => string | Uint8Array | null | undefined)
     | null
     | undefined;
   declare static isSignedIdVerifierSecret: boolean;
diff --git a/packages/activerecord/lib/signed-id.ts b/packages/activerecord/lib/signed-id.ts
index 2b70a72624..cf5e46e84e 100644
--- a/packages/activerecord/lib/signed-id.ts
+++ b/packages/activerecord/lib/signed-id.ts
@@ -13,7 +13,12 @@ import { UnknownPrimaryKey } from "./errors.js";
 import { ArgumentError, toS } from "@blazetrails/ruby-compat";

 export interface SignedId {
-  readonly signedIdVerifierSecret: string | (() => string | null | undefined) | null | undefined;
+  readonly signedIdVerifierSecret:
+    | string
+    | Uint8Array
+    | (() => string | Uint8Array | null | undefined)
+    | null
+    | undefined;
 }

 export const SignedId = {
@@ -31,7 +36,8 @@ export class ClassMethods {
     return (this._signedIdVerifier = (() => {
       let secret = (this as any).signedIdVerifierSecret as
         | string
-        | (() => string | null | undefined)
+        | Uint8Array
+        | (() => string | Uint8Array | null | undefined)
         | null
         | undefined;
       if (typeof secret === "function") secret = secret();
diff --git a/packages/trailties/lib/trailties/active-record.ts b/packages/trailties/lib/trailties/active-record.ts
index 90c1631c30..6cf3d5e766 100644
--- a/packages/trailties/lib/trailties/active-record.ts
+++ b/packages/trailties/lib/trailties/active-record.ts
@@ -416,6 +416,13 @@ export class Trailtie extends BaseTrailtie {
       });
     });

+    this.initializer("active_record.set_signed_id_verifier_secret", () => {
+      onLoad("active_record", function (this: typeof ActiveRecord.Base) {
+        this.signedIdVerifierSecret ??= () =>
+          Trails.application!.keyGenerator().generateKey("active_record/signed_id");
+      });
+    });
+
     this.initializer("active_record.generated_token_verifier", () => {
       this.config.afterInitialize((app: Application) => {
         onLoad("active_record", function (this: typeof ActiveRecord.Base) {
diff --git a/packages/trailties/test/trailties/active-record.test.ts b/packages/trailties/test/trailties/active-record.test.ts
index e489010413..0824e273bd 100644
--- a/packages/trailties/test/trailties/active-record.test.ts
+++ b/packages/trailties/test/trailties/active-record.test.ts
@@ -218,6 +218,17 @@ describe("RailtieTest", () => {
     }
   });

+  it("runInitializers seats a signed id verifier secret derived from the app's key generator", async () => {
+    const saved = Object.getOwnPropertyDescriptor(Base, "signedIdVerifierSecret");
+    Base.signedIdVerifierSecret = null;
+    try {
+      await runTrailtieInitializers(Trailtie, blogApp());
+      expect(typeof Base.signedIdVerifierSecret).toBe("function");
+    } finally {
+      if (saved) Object.defineProperty(Base, "signedIdVerifierSecret", saved);
+    }
+  });
+
   it("runInitializers forwards config.encryption to Encryption.Configurable", async () => {
     const cfg = Trailtie.config.get("activeRecord") as ActiveRecordConfig;
     cfg.encryption = { supportUnencryptedData: true };
```

## Acceptance criteria

- The initializer seats a lazy secret from `Trails.application.keyGenerator().generateKey("active_record/signed_id")`.
- A trailties railtie test pins it.
