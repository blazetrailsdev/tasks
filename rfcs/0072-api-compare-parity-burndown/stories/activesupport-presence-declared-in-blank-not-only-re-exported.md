---
title: "presence reads missing on blank.ts: it is only re-exported, never declared"
status: done
updated: 2026-08-08
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6248
claim: "2026-08-08T17:15:57Z"
assignee: "enroll-sqlite-rake-test-in-test-compare"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #6238 (`reopeningMethodCreditedToOwnFile`). With every `Object`
reopening now credited to its own TS file, `core_ext/object/acts_like.rb`'s
bucket reads 8/10 — `acts_like?` (genuinely unported, duck typing in JS) and
**`presence`**.

`presence` is NOT unported: Rails defines it at
`vendor/rails/activesupport/lib/active_support/core_ext/object/blank.rb:44-46`

```ruby
def presence
  self if present?
end
```

and trails implements it in `packages/activesupport/src/string-utils.ts`.
`core-ext/object/blank.ts` only re-exports it:

```ts
import { isBlank, isPresent, presence } from "../../string-utils.js";
export { isBlank, isPresent, presence };
```

The extractor reads declarations, not `export { … }` re-export lists, so
`presence` has no declaration in the file mirroring `blank.rb` and reads missing.
Its siblings `blank?` / `present?` DO match because `blank.ts` declares them as
statics on its `Object` class overload set (`dist/core-ext/object/blank.d.ts:10-27`)
— `presence` has no such declaration.

Note the neighbouring shape is the same problem one level up: `blank?`/`present?`
are also implemented in `string-utils.ts` and merely re-exported for the value
arms; only the `Object` static overloads make them visible.

## Converged shape

Give `presence` a declaration in `core-ext/object/blank.ts` alongside the
`blank?` / `present?` arms it sits next to in `blank.rb:14-46`, rather than
leaving it visible only through a re-export. Rails puts all three in one file on
one receiver; trails should read the same way.

Do NOT reach for a `RUBY_FILE_TS_OVERRIDES` entry or a baseline row — the method
is ported, it is the file layout that diverges.

## Acceptance criteria

- [ ] `core_ext/object/acts_like.rb`'s bucket reports `acts_like?` as its only
      missing member.
- [ ] `presence` keeps its Rails name and single implementation (no duplicate
      body).
- [ ] `pnpm parity:api` delta non-negative.
