---
title: "Converge the duplicated snake_case I18n key maps in to_sentence ports"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6045
claim: "2026-08-04T02:40:53Z"
assignee: "i18n-connector-key-camelization-duplicated"
blocked-by: null
closed-reason: null
---

## Context

Two `to_sentence` ports now carry their own private snake_case→camelCase map for
the `support.array` connector keys:

- `packages/activesupport/src/array-utils.ts` (`I18N_KEY_MAP` /
  `camelizeI18nKeys`, PR #6039)
- `packages/actionview/src/helpers/output-safety-helper.ts:86-93`
  (`I18N_KEY_MAP`, PR #6040)

`packages/actionview/src/helpers/number-helper/number-converter.ts` has a third
one. Rails needs none of them: the I18n store keys and the option keys are the
same Ruby symbols
(`activesupport/lib/active_support/core_ext/array/conversions.rb:68-70`,
`actionview/lib/action_view/helpers/output_safety_helper.rb:50-53`), so every
one of these maps is trails-only surface introduced by the camelCase convention.

## Acceptance criteria

- Decide the single settled idiom for reading a snake_case I18n payload into
  camelCase options (e.g. the existing `camelize` in
  `@blazetrails/activesupport`, applied at the lookup boundary), and document it
  where the other I18n-consuming ports will find it.
- Converge all three sites onto it; no per-file key map survives.
- No new public surface (`pnpm parity:api:extra` non-negative for `activesupport` and
  `actionview`).
