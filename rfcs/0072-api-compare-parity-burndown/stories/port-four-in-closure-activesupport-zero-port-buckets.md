---
title: "Port the four in-closure activesupport buckets left unscoped by the phantom-credit triage"
status: done
updated: 2026-08-12
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6428
claim: "2026-08-12T17:36:52Z"
assignee: "converge-collection-proxy-rich-reflection-re-resolve"
blocked-by: null
closed-reason: null
---

## Context

PR #6423 triaged the 31 zero-port buckets un-hidden by #6414. Twenty-two were
scoped (actionview/trailties, out of closure) and five were real ports living
under another file name (`RUBY_FILE_TS_OVERRIDES`). Four activesupport buckets
were deliberately left **unscoped** because they are in-closure and genuinely
unported — each already carries a trails test file with no source behind it:

| Ruby file                      | members | trails test                         |
| ------------------------------ | ------: | ----------------------------------- |
| `core_ext/object/acts_like.rb` |      10 | `core-ext/object/acts-like.test.ts` |
| `core_ext/array/access.rb`     |      16 | `core-ext/array/access.test.ts`     |
| `core_ext/numeric/bytes.rb`    |      19 | —                                   |
| `testing/constant_lookup.rb`   |       5 | `testing/constant-lookup.test.ts`   |

Rails sources:
`vendor/rails/activesupport/lib/active_support/core_ext/object/acts_like.rb`,
`.../core_ext/array/access.rb`, `.../core_ext/numeric/bytes.rb`,
`.../testing/constant_lookup.rb`.

## Converged shape

Port each file at the path `docs/ruby-ts-conventions.md` derives — `acts-like.ts`,
`core-ext/array/access.ts`, `core-ext/numeric/bytes.ts`,
`testing/constant-lookup.ts` — method for method. `acts_like.rb` and
`access.rb` reopen `Object`/`Array`, so follow the existing core_ext idiom
(standalone exported functions, not prototype patches). Likely more than one PR;
split by file if so.

## Acceptance criteria

- Each of the four buckets reports `tsFileExists: true` with its members matched
  in `parity:api`.
- No new `unported-files` entry is added for any of them — they are real debt,
  not a scope decision.
- The existing trails test files exercise the ported source rather than a
  stand-in.
