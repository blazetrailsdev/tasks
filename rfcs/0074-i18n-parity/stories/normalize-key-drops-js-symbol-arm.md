---
title: "Drop the JS Symbol arm from normalize_key so the memo keys on key itself"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6064
claim: "2026-08-04T14:34:07Z"
assignee: "normalize-key-drops-js-symbol-arm"
blocked-by: null
closed-reason: null
---

## Context

`normalizeKey` still carries a JS-`Symbol` arm that Rails has no counterpart
for (`packages/i18n/src/i18n.ts:379`, on `main` after PR #6027):

```ts
if (typeof key === "symbol") key = Symbol.keyFor(key) ?? key.description;
```

The gem's `normalize_key` (`vendor/i18n/lib/i18n.rb:441-463`) has exactly one
coercion, `key.to_s`, inside the `else` arm. It has no branch on the key's
_type_ — a Ruby Symbol and a String both simply answer `to_s`.

Per CLAUDE.md and RFC 0082, a Ruby Symbol value is a colon-prefixed JS string
(`":short"`), never a JS `Symbol`; `i18n-symbol-values-are-colon-strings`
(done) and `i18n-fallbacks-symbol-arms-break-typecheck` (closed) already
flipped the producers, and `TranslateKey` / `TranslationKey` no longer admit
`symbol`. This line is the last consumer-side defence against a value shape
that can no longer be constructed through the typed surface, so it is dead
weight that reads to a Rails dev as a branch the gem does not have.

It also forces a second deviation immediately above it: because the line
_reassigns_ `key`, `normalizeKey` must capture `const cacheKey = key` to key
the memo on the original value (`i18n.ts:376`). Rails writes
`@@normalized_key_cache[separator][key] ||= ...` against the one `key`
binding (`i18n.rb:442`). Deleting the Symbol arm collapses `cacheKey` back
into `key` and converges the memo to the Ruby line exactly.

## Converged shape

```ts
function normalizeKey(key: unknown, separator: string): TranslationKey[] {
  let bySeparator = normalizedKeyCache.get(separator);
  if (bySeparator === undefined) {
    bySeparator = new Map();
    normalizedKeyCache.set(separator, bySeparator);
  }
  let normalized = bySeparator.get(key);
  if (normalized === undefined) {
    // ...the three Rails branches, unchanged, with `String(key)` in the else arm
    bySeparator.set(key, normalized);
  }
  return normalized;
}
```

The JSDoc above `normalizeKey` explaining the `String(symbol)` /
`"Symbol(name)"` hazard goes with it.

## Acceptance criteria

- `packages/i18n/src/i18n.ts` has no `typeof key === "symbol"` arm in
  `normalizeKey`, and no `cacheKey` local — the memo reads and writes `key`,
  matching `vendor/i18n/lib/i18n.rb:442`.
- No caller anywhere in the monorepo passes a JS `Symbol` to `translate` /
  `normalizeKeys`; grep is clean for `Symbol(` reaching an i18n key argument.
- The i18n suite stays green (352 passing as of PR #6027), in particular the
  `MissingTranslation#keys` cases the deleted JSDoc cites.
