---
title: "Port SecureRandom.alphanumeric"
status: done
updated: 2026-11-25
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10720
claim: "2026-11-24T21:01:51Z"
assignee: "secure-random-alphanumeric"
blocked-by: null
closed-reason: null
---

## Context

`SecureRandom.alphanumeric` (`Random::Formatter#alphanumeric`, `vendor/ruby/v3.3.11/lib/random/formatter.rb:344-372`, with `choose` at `:314` and `random_number` in `random.c`) is unported in `packages/ruby-compat/lib/secure-random.ts`. Rails apps call it (Writebook's join codes and attachment slugs).

The Writebook example (trails#10716) depends on this. A working patch from that branch, with its test:

```diff
diff --git a/packages/ruby-compat/lib/secure-random.ts b/packages/ruby-compat/lib/secure-random.ts
index b17405e27c..519ab4fb18 100644
--- a/packages/ruby-compat/lib/secure-random.ts
+++ b/packages/ruby-compat/lib/secure-random.ts
@@ -3,6 +3,12 @@ import type { Bytes } from "./fs-adapter.js";
 import { NotImplementedError } from "./not-implemented-error.js";
 import { strDelete, trTrans } from "./string/tr.js";

+const ALPHANUMERIC: readonly string[] = [
+  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ",
+  ..."abcdefghijklmnopqrstuvwxyz",
+  ..."0123456789",
+];
+
 /**
  * `SecureRandom` (`vendor/ruby/v3.3.11/lib/securerandom.rb:41`), extended with
  * `Random::Formatter` (`securerandom.rb:93`) so `random_bytes`, `hex` and
@@ -64,6 +70,64 @@ export const SecureRandom = {
     return s;
   },

+  /** @noRailsEquivalent PERMANENT — vendor/ruby/v3.3.11/lib/random/formatter.rb:344 */
+  ALPHANUMERIC: ALPHANUMERIC,
+
+  /** @noRailsEquivalent PERMANENT — vendor/ruby/v3.3.11/lib/random/formatter.rb:369 */
+  alphanumeric(
+    n: number | null = null,
+    { chars = ALPHANUMERIC }: { chars?: readonly string[] } = {},
+  ): string {
+    if (n == null) n = 16;
+    return SecureRandom.choose(chars, n);
+  },
+
+  /** @noRailsEquivalent PERMANENT — vendor/ruby/v3.3.11/lib/random/formatter.rb:314 */
+  choose(source: readonly string[], n: number): string {
+    const size = source.length;
+    let m = 1;
+    let limit = size;
+    while (limit * size <= 0x100000000) {
+      limit *= size;
+      m += 1;
+    }
+    let result = "";
+    while (m <= n) {
+      const is = digits(SecureRandom.randomNumber(limit), size);
+      while (is.length < m) is.push(0);
+      result += is.map((i) => source[i]).join("");
+      n -= m;
+    }
+    if (0 < n) {
+      const is = digits(SecureRandom.randomNumber(limit), size);
+      if (is.length < n) {
+        while (is.length < n) is.push(0);
+      } else {
+        while (n < is.length) is.pop();
+      }
+      result += is.map((i) => source[i]).join("");
+    }
+    return result;
+  },
+
+  /**
+   * `Random::Formatter#random_number` for an Integer limit of at most 2**32
+   * (`rand_random_number` → `rand_int`, `vendor/ruby/v3.3.11/random.c:1375`),
+   * drawn from `gen_random` bytes and retried over the biased tail the way
+   * `random_ulong_limited` retries (`vendor/ruby/v3.3.11/random.c:1190`).
+   *
+   * @noRailsEquivalent PERMANENT — vendor/ruby/v3.3.11/random.c:1606
+   */
+  randomNumber(limit: number): number {
+    const range = 0x100000000;
+    const cutoff = range - (range % limit);
+    for (;;) {
+      const bytes = SecureRandom.genRandom(4);
+      const value = new DataView(bytes.buffer, bytes.byteOffset, 4).getUint32(0);
+      if (value < cutoff) return value % limit;
+    }
+  },
+
   /** @noRailsEquivalent PERMANENT — vendor/ruby/v3.3.11/lib/random/formatter.rb:170 */
   uuid(): string {
     const bytes = SecureRandom.randomBytes(16);
@@ -82,3 +146,12 @@ export const SecureRandom = {
     return `${hex(ary[0], 8)}-${hex(ary[1], 4)}-${hex(ary[2], 4)}-${hex(ary[3], 4)}-${hex(ary[4], 4)}${hex(ary[5], 8)}`;
   },
 };
+
+function digits(value: number, base: number): number[] {
+  const out: number[] = [];
+  do {
+    out.push(value % base);
+    value = Math.floor(value / base);
+  } while (value > 0);
+  return out;
+}
diff --git a/packages/ruby-compat/test/secure-random.trails.test.ts b/packages/ruby-compat/test/secure-random.trails.test.ts
index 17797f4f80..d1a2aefc8b 100644
--- a/packages/ruby-compat/test/secure-random.trails.test.ts
+++ b/packages/ruby-compat/test/secure-random.trails.test.ts
@@ -50,4 +50,27 @@ describe("SecureRandom", () => {
       cryptoAdapterConfig.adapter = null;
     }
   });
+
+  it("alphanumeric", () => {
+    for (let n = 0; n < 65; n++) {
+      const an = SecureRandom.alphanumeric(n);
+      expect(an).toMatch(/^[0-9a-zA-Z]*$/);
+      expect(an.length).toBe(n);
+    }
+  });
+
+  it("alphanumeric chars", () => {
+    const cases: [string[], RegExp][] = [
+      [[..."0123456789"], /^\d*$/],
+      [[..."abcdefghijklmnopqrst"], /^[a-t]*$/],
+      [[..."一二三四五六七八九十"], /^[一二三四五六七八九十]*$/],
+    ];
+    for (const [chars, pattern] of cases) {
+      for (let n = 0; n < 10; n++) {
+        const an = SecureRandom.alphanumeric(n, { chars });
+        expect(an).toMatch(pattern);
+        expect([...an].length).toBe(n);
+      }
+    }
+  });
 });
```

## Acceptance criteria

- `alphanumeric`, `choose` and `randomNumber` are ported.
- MRI's `test_alphanumeric` and `test_alphanumeric_chars` (`vendor/ruby/v3.3.11/test/ruby/test_random_formatter.rb:119-139`) pass.
