---
title: "inflector-ordinal-via-i18n-translate"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 5954
claim: "2026-08-03T03:05:45Z"
assignee: "inflector-ordinal-via-i18n-translate"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/inflector.ts:344` implements `ordinal` by
hardcoding the English `st`/`nd`/`rd`/`th` rules. Rails delegates to I18n:

```ruby
# vendor/rails/activesupport/lib/active_support/inflector/methods.rb:334
def ordinal(number)
  I18n.translate("number.nth.ordinals", number: number)
end
```

`ordinalize` (methods.rb:352) reaches `translate` through `ordinal`, so it
carries the same divergence.

The gap was invisible until the file-manifest fix for
`inflector-methods-rb-unmapped-in-file-manifest` gave `inflector/methods.rb`
its own comparison bucket; the two entries are now baselined in
`scripts/api-compare/call-mismatches-wide-exclude/activesupport/inflector.json`
with a reason naming this story.

trails activesupport ships no I18n backend today (`grep -rn "number.nth.ordinals"
packages/*/src` is empty), so converging means deciding what the trails
translate seam is first.

## Acceptance criteria

- `ordinal` routes through a translation lookup keyed
  `number.nth.ordinals` rather than hardcoded English suffixes, with the
  English rules living in the default locale data.
- `ordinalize` keeps delegating to `ordinal`.
- The two `translate` entries are removed from
  `call-mismatches-wide-exclude/activesupport/inflector.json` (they must stop
  flagging, not be re-reasoned).
- Existing inflector tests for `ordinal`/`ordinalize` keep passing unchanged.
