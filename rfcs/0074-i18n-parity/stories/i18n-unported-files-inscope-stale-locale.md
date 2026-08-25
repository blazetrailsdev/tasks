---
title: "inScope set omits five ported i18n locale files, redding unported-files.test.ts on main"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 6063
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/unported-files.test.ts` — "accounts for every file in the
vendored i18n lib tree" — **fails on `origin/main`**, and has since before PR #6060
(verified by diffing its failure output with that branch's files checked
out from `main`: the unaccounted set was byte-identical). The test asserts every
file under the vendored i18n lib tree is either in a hand-written `inScope` set
or excluded by `UNPORTED_FILES`; five ported files are in neither:

```text
locale.rb · locale/fallbacks.rb · locale/tag.rb
locale/tag/parents.rb · locale/tag/simple.rb
```

All five are ported and none is deferred:

| Rails                                        | trails                                    |
| -------------------------------------------- | ----------------------------------------- |
| `vendor/i18n/lib/i18n/locale.rb`             | `packages/i18n/src/locale.ts`             |
| `vendor/i18n/lib/i18n/locale/fallbacks.rb`   | `packages/i18n/src/locale/fallbacks.ts`   |
| `vendor/i18n/lib/i18n/locale/tag.rb`         | `packages/i18n/src/locale/tag.ts`         |
| `vendor/i18n/lib/i18n/locale/tag/parents.rb` | `packages/i18n/src/locale/tag/parents.ts` |
| `vendor/i18n/lib/i18n/locale/tag/simple.rb`  | `packages/i18n/src/locale/tag/simple.ts`  |

`locale/fallbacks_test.rb` is 29/29 green in `pnpm parity:test`, so this is a
stale `inScope` list, not a porting gap. `locale/tag/rfc4646.rb` is correctly
excluded already and stays excluded (story `i18n-locale-tag-rfc4646`, blocked).

`scripts/api-compare/` is inside `UNIT_TESTS_PKGS_RE`, so this reds the Unit
Tests job. PR #6060 added `backend/key_value.rb` to `inScope` for exactly this
reason but deliberately scoped its change to the KeyValue convergence under
review and left this set untouched.

## Acceptance criteria

- The five `locale*` files above are added to the `inScope` set in
  `scripts/api-compare/unported-files.test.ts`, not excluded via
  `UNPORTED_FILES` — they are ported, and an exclusion would hide real surface.
- `pnpm vitest run scripts/api-compare/unported-files.test.ts` is green,
  including the second-direction loop that asserts no `inScope` file is
  reported unported.
- If that loop then fails on `backend/flatten.rb` or any other `inScope` entry
  that still carries a `UNPORTED_FILES` row, converge that row (delete it) —
  do not drop the file from `inScope` to silence the assertion.
- No i18n `parity:api` or `parity:test` matched count regresses.
