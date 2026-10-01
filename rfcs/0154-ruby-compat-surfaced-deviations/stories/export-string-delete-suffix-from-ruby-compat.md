---
title: "Export String#delete_suffix from ruby-compat and retire the open-coded copies"
status: draft
updated: 2026-10-01
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`String#delete_suffix` (`vendor/ruby/v3.3.11/string.c:10878` `rb_str_delete_suffix`) has no
exported ruby-compat function, so each Rails body that calls it open-codes it:

- `packages/ruby-compat/src/string/method-table.ts:393-397` has a module-private
  `deleteSuffix` (and `deletePrefix` beside it), reachable only through the `RString`
  method table.
- `packages/activesupport/src/core-ext/load-error.ts:14-16` re-declares a local
  `deleteSuffix` for `LoadError#is_missing?`
  (`activesupport/lib/active_support/core_ext/load_error.rb`).
- `packages/actionview/src/helpers/form-helper.ts` `FormBuilder#fieldsFor` spells
  `object_name.to_s.delete_suffix("[]")`
  (`actionview/lib/action_view/helpers/form_helper.rb:2312`) as an `endsWith` /
  `slice(0, -2)` pair (trails#8327 review finding 1).

That is three call sites, which satisfies ruby-compat's "only what trails actually calls"
rule.

## Acceptance criteria

- ruby-compat exports `deleteSuffix` (and `deletePrefix`, if a second caller exists) as the
  port of `rb_str_delete_suffix`, with its `@noRailsEquivalent PERMANENT` receipt, and the
  method table calls the exported function.
- `load-error.ts` drops its local copy and `FormBuilder#fieldsFor` calls
  `deleteSuffix(String(objectName), "[]")`, so both read as the Rails line.
- `pnpm parity:api:extra:gate` stays green for ruby-compat.
