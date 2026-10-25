---
title: "activesupport: spell Enumerable calls on Sets/Maps as new Enumerable(x).m(...)"
status: draft
updated: 2026-10-25
rfc: "0194-ruby-compat-native-first"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9292 made `new Enumerable(x)` (`packages/ruby-compat/src/enumerable.ts`) wrap any Array, Set, Map, generator or `each`-answerer. The call gates credit `new Enumerable(xs).m(...)` as Ruby's `xs.m(...)`: the call set gets `m`, the call-args site gets `xs` as its receiver, and no construction is recorded. In activesupport, a Rails body that calls an `Enumerable` method on a Set, a Hash or a lazy collection is often ported as a spread or `Array.from` followed by a JS array method. That spelling drops the Ruby method name, so the call gates can't credit it.

Candidate sites, found by grepping for `[...x].filter|map|reduce|some|find` and `Array.from(x.values())`. Check each one against its Rails body before converting:

```text
packages/activesupport/src/backtrace-cleaner.ts:89:    const gemsPaths = [...new Set([...Gem.path, Gem.defaultDir])].map((p) => regexpEscape(p));
packages/activesupport/src/ordered-options.ts:116:    const pairs = [...this.data.entries()].map(([k, v]) => `${k}: ${JSON.stringify(v)}`);
packages/activesupport/src/cache/coder.ts:180:  [...STRING_ENCODINGS].map(([type, encoding]) => [type, new StringDeserializer(encoding)]),
packages/activesupport/src/concurrency/share-lock.ts:196:          compatible = [...new Set(compatible)].filter((c) => previousWait![1].includes(c));
packages/activesupport/src/concurrency/share-lock.ts:236:      [...this.waiting].some(([t, [, c]]) => t !== Thread.current() && !c.includes(purpose))
packages/activesupport/src/concurrency/share-lock.ts:242:    return [...this.waiting].some(
packages/activesupport/src/ordered-hash.ts:29:      [...this].map(([k, v]) => new Hash<K, V>().set(k, v)),
packages/activesupport/src/ordered-hash.ts:152:    const parts = [...this.entries()].map(([k, v]) => `${JSON.stringify(k)}=>${JSON.stringify(v)}`);
packages/activesupport/src/cache/store.ts:288:      payload.hits = [...results.keys()].map((name) => this.normalizeKey(name, options));
packages/activesupport/src/cache/store.ts:343:      payload.hits = [...reads.keys()].map((name) => this.normalizeKey(name, options));
packages/activesupport/src/hash-with-indifferent-access.ts:291:    const omit = this.slice(...[...this.keys()].filter((key) => !keys.includes(key)));
packages/activesupport/src/core-ext/securerandom.ts:7:export const BASE58_ALPHABET = [...DIGITS, ...UPPERCASE, ...LOWERCASE].filter(
packages/activesupport/src/inflector/inflections.ts:155:      const escaped = Array.from(this.acronyms.values())
packages/activesupport/src/messages/rotation-coordinator.ts:99:          `${[...this.#codecs.keys()].map((salt) => `- ${inspect(salt)}`).join("\n")}\n
```

## Acceptance criteria

- [ ] Every site whose Rails body calls an `Enumerable` method on a non-Array receiver is spelled `new Enumerable(x).<railsName>(...)`, or as the free function where the receiver is already an Array.
- [ ] Sites whose Rails body really builds an Array first (`to_a`, `values`) are left alone.
- [ ] `pnpm parity:api:calls` and `parity:api:calls:args` stay green. Delete any baseline row that goes stale and tighten its mark.
