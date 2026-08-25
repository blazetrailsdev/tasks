---
title: "Declare backend/flatten.rb deferred surface"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 6046
claim: "2026-08-04T02:55:58Z"
assignee: "i18n-defer-backend-flatten"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api` reports i18n at `files: 13/14` — the one unmatched Ruby file
is `backend/flatten.rb`, all 8 of its members unported:

```text
--- backend/flatten.rb  0 / 8
   MISS normalize_flat_keys · links · flatten_keys · flatten_translations
        store_link · resolve_link · find_link · escape_default_separator
```

`I18n::Backend::Flatten` (`vendor/i18n/lib/i18n/backend/flatten.rb:13`) is only
mixed into deferred backends: `key_value.rb:73` (`include Base, Flatten`),
`cache_file.rb:19`, `memoize.rb:38`. Every one of those is on this RFC's
"Deferrable surface" list (RFC 0074 README) and already carries an
`unported-files.ts` entry (`scripts/api-compare/unported-files.ts:1146-1177`).
`Simple` does **not** include it (`vendor/i18n/lib/i18n/backend/simple.rb:20-23`
is `include Base` only), so nothing ported depends on it.

Flatten was simply missed when the deferral entries were written, so it scores
as a real 8-method gap instead of a declared exclusion.

## Acceptance criteria

- `scripts/api-compare/unported-files.ts` gains a `backend/flatten.rb` entry,
  `package: "i18n"`, with a reason naming the three deferred consumers
  (`key_value.rb`, `cache_file.rb`, `memoize.rb`) — same shape as the sibling
  entries at lines 1141-1177.
- `pnpm parity:api` reports i18n `files: 13/13` and the method denominator
  drops by 8 (130/135), with no other package's numbers moving.
- No `flatten.ts` stub is added (CLAUDE.md: no placeholder files).
