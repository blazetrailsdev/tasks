---
title: "i18n-normalizekey-dead-symbol-arm"
status: done
updated: 2026-08-04
rfc: "0061-ci-failures"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6038
claim: "2026-08-04T00:56:41Z"
assignee: "i18n-normalizekey-dead-symbol-arm"
blocked-by: null
closed-reason: null
---

## Context

`normalizeKey` in `packages/i18n/src/i18n.ts:357` still carries the pre-#6032
JS-symbol arm:

```ts
if (typeof key === "symbol") key = Symbol.keyFor(key) ?? key.description;
```

PR #6032 moved Ruby Symbol _values_ onto the `":name"` spelling, and #6031
converged the callers by applying Ruby's `Symbol#to_s` at each call site before
handing the key to `I18n.translate`. Nothing in the tree passes a JS `Symbol` as
a translate key any more, so the arm is unreachable.

Rails' `normalize_key` (`i18n/lib/i18n.rb:441-447`) has no such branch — it does
`key.to_s.split(separator)`. The faithful shape is either a bare `String(key)`
or, if the colon-stripping is wanted here rather than at the call sites,
`key.to_s` modelled as the colon strip. Note #6031 chose the call sites; picking
`normalizeKey` instead would let those call sites pass the Symbol spelling
straight through, which is what the gem does.

## Acceptance criteria

- The `typeof key === "symbol"` branch is gone from `normalizeKey`.
- Whichever site owns `Symbol#to_s` is cited to `i18n.rb:447` at the call site.
- No behaviour change: `pnpm vitest run packages/i18n` and
  `pnpm vitest run packages/activemodel` stay green.

## Definition of done

- `pnpm parity:api:calls` / `pnpm parity:api:calls` non-negative.
- `grep -rn "Symbol.keyFor" packages/i18n/src` is empty.

## Verification

`pnpm vitest run packages/i18n packages/activemodel`
