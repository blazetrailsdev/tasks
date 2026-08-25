---
title: "i18n-key-value-residual-api-gaps"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6063
claim: "2026-08-04T14:19:06Z"
assignee: "i18n-key-value-residual-api-gaps"
blocked-by: null
closed-reason: null
---

## Context

PR #6060 deleted the stale `backend/key_value.rb` and `backend/flatten.rb`
deferrals from `scripts/api-compare/unported-files.ts` (both are ported:
`packages/i18n/src/backend/key-value.ts`, `.../flatten.ts`). That took i18n
`parity:api` from `130/136 methods (95.6%) | files: 13/13 | inheritance: 6/6`
to `177/186 methods (95.2%) | files: 15/15 | inheritance: 6/7` — measuring 47
more methods and 2 more files, and surfacing the gaps below, which were
previously hidden by the whole-file deferral.

Residual gaps now visible (`scripts/api-compare/output/api-comparison.json`):

1. Inheritance: `I18n::JSON` reported `ts-class-missing`
   (`rubyFile: backend/key_value.rb`, `tsFile: backend/key-value.ts`). Rails
   defines it at `vendor/i18n/lib/i18n/backend/key_value.rb:7-22` as a
   load-time shim picking a JSON library — `Oj` when the gem is present, else
   `JSON = ActiveSupport::JSON`. JS has `JSON` in the language and trails'
   KeyValue calls `JSON.parse` / `JSON.stringify` directly
   (`key-value.ts:10-11` documents this), so there is no class to mirror.
   Note a `SCOPED_SKIP_GROUPS` entry does NOT suppress it — the inheritance
   checker does not consult that register — so closing this needs either an
   inheritance-side exclusion mechanism or a decision to leave it reported.
2. i18n missing methods went 6 → 9 with the deferral removed. Identify the 3
   newly-visible `KeyValue` / `Flatten` members and port or justify each.

Also still open and unrelated to KeyValue: `unported-files.test.ts`
("accounts for every file in the vendored i18n lib tree") fails on
`origin/main` with `locale.rb`, `locale/tag.rb`, `locale/tag/parents.rb`,
`locale/tag/simple.rb` and `locale/fallbacks.rb` unaccounted. PR #6060 left
that set byte-identical.

## Acceptance criteria

- `I18n::JSON` is either mirrored, suppressed by a reviewed mechanism the
  inheritance check actually honours, or the check is taught that a Ruby-only
  library shim is not a gap — not silenced by an inert register row.
- The 3 newly-visible i18n missing methods are ported or carry a reviewed
  justification at the call site.
- i18n `parity:api` matched-method and matched-file counts do not regress
  from `177/186` and `15/15`.
