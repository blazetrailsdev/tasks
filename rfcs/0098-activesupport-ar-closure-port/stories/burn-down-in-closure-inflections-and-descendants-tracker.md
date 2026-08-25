---
title: "burn-down-in-closure-inflections-and-descendants-tracker"
status: done
updated: 2026-08-16
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6604
claim: "2026-08-16T18:32:19Z"
assignee: "burn-down-in-closure-inflections-and-descendants-tracker"
blocked-by: null
closed-reason: null
---

## Context

Split (b) of [[burn-down-in-closure-small-file-residue]], whose own Notes say
13 files is more than one PR. PR for the parent shipped split (a) — the
array/hash/enumerable core-ext group, `number_helper.rb`'s
`number_to_delimited` (plus the `autoload*`/`eager_load!` SKIP_GROUPS entry),
`inflector/methods.rb`'s `const_regexp` and `inflector/transliterate.rb`'s
`parameterize`. This story is the inflections + descendants-tracker remainder.

| Rails file                 | TS file                    | Missing members                                                            |
| -------------------------- | -------------------------- | -------------------------------------------------------------------------- |
| `inflector/inflections.rb` | `inflector/inflections.ts` | `Inflections#initialize`, `#instance_or_fallback`, `Inflector#inflections` |
| `descendants_tracker.rb`   | `descendants-tracker.ts`   | `WeakSet#include?`, `#disable_clear!`, `#reject!`                          |

Read `vendor/rails/activesupport/lib/active_support/inflector/inflections.rb`
and `vendor/rails/activesupport/lib/active_support/descendants_tracker.rb`
before writing; `Inflections#initialize` is a Ruby lifecycle hook only in name
here — it is a real constructor with a body, not an `included`/`inherited`
hook, so it ports.

## Acceptance criteria

- [ ] Each member above is ported at its Rails name per
      `docs/ruby-ts-conventions.md`, or carries a `SKIP_GROUPS` reason.
- [ ] `pnpm parity:api:calls` / `:args` green with no new baseline rows;
      `pnpm parity:api:extra --package activesupport` shows no new surface.
