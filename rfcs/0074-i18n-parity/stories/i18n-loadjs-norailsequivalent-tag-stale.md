---
title: "i18n-loadjs-norailsequivalent-tag-stale"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6062
claim: "2026-08-04T13:53:40Z"
assignee: "i18n-loadjs-norailsequivalent-tag-stale"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:extra --package i18n` reports (on `origin/main`, independent of any
current work):

```text
extra-surface: 1 STALE @noRailsEquivalent tag(s) ...
  - i18n  backend/base.ts  loadJs
```

`Base#loadJs` in `packages/i18n/src/backend/base.ts` is `protected`, so the tag
sitting on it is never counted. The declaration that actually flags as novel
extra surface is `loadJs` in `packages/i18n/src/backend/simple.ts` — deleting
the base.ts tag alone moves i18n's novel count up by one, so the fix is to put
the reason where the surface is measured (or converge the surface itself).

Rails anchor: `i18n` gem `lib/i18n/backend/base.rb:254-257` (`load_rb` —
`eval(IO.read(filename), binding, filename)`), which `loadJs` stands in for.

## Acceptance criteria

- `pnpm parity:api:extra --package i18n` reports no STALE `@noRailsEquivalent` tags.
- i18n's novel count does not increase.
