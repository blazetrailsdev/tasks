---
title: "Call gate: credit native Array forms (compact/uniq/union/take/drop/to_h/zip/count/sort) on a proven array receiver"
status: done
updated: 2026-10-22
rfc: "0194-ruby-compat-native-first"
cluster: gate
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: trails#9260
claim: "2026-10-22T23:05:33Z"
assignee: "native-analogues-array-calls"
blocked-by: null
closed-reason: null
---

## Context

The call gates send an Array call either to a helper or to nothing. The
reverse reading of `RECEIVER_KEYED_RUBY_COMPAT_EXPORTS`
(`scripts/parity/ruby-compat.ts:111-142`) credits `compact(ary)`,
`aryCount`, `aryDelete`, `aryIncludes`, `aryJoin`, `reduce` and `sort` for
`Array#compact` / `#count` / `#delete` / `#include?` / `#join` / `#reduce` /
`#sort`. `JS_ENUMERABLE_ALIASES` (`scripts/api-compare/enumerable-idioms.ts:41`)
credits only call names, and `NATIVE_FORM_ANALOGUES` (`:332`) has no Array row
except `size` / `length` / `prepend`. Under the native-required policy (owner
ruling, 2026-10-19) a call site on a proven `array` receiver writes the JS
form, so the gate has to credit that form first. Otherwise each substitution
sweep would red `parity:api:calls`.

Forms to credit on a Ripper-proven `array` kind, scoped the same way
`POSITIONAL_ARRAY_ANALOGUES` is:

- `compact`: `.filter((x) => x != null)`, marked by the extractor
- `uniq` with no block: `[...new Set(xs)]` / `Array.from(new Set(xs))`
- `union` / `|`: `[...new Set([...a, ...b])]`
- `take(n)` / `drop(n)`: `.slice(0, n)` / `.slice(n)`
- `join`: `.join` (rubyMethodToTs already produces it, so only the table row goes)
- `count` with a block: `.filter(fn).length`
- `to_h` on an Array of pairs: `Object.fromEntries` / `new Map(pairs)`
- `zip`: `.map((x, i) => [x, b[i]])`
- `include?`: `.includes` (already a convention candidate)
- `sort` with no block: `.sort()` / `.toSorted()`

## Acceptance criteria

- [ ] Each form above credits its Ruby call only where every site of that name in the Ruby body has an `array` kind, and the `compare.test.ts` fixtures cover both the credited and the uncredited case (an `ivar` receiver still flags).
- [ ] The `Array#*` rows whose form is now credited leave `RECEIVER_KEYED_RUBY_COMPAT_EXPORTS`, so the reverse reading never asks for a helper over the native form. `call-args.ts:567-575` drops them with the rows.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` are green on main with no new baseline rows, and any row the credit makes stale is deleted and tightened.
