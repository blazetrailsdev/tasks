---
title: "actionview-to-sentence-i18n-connectors"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6040
claim: "2026-08-04T01:33:59Z"
assignee: "actionview-to-sentence-i18n-connectors"
blocked-by: null
closed-reason: null
---

## Context

`packages/actionview/src/helpers/output-safety-helper.ts:94-127` is the
HTML-safe `to_sentence`
(`actionview/lib/action_view/helpers/output_safety_helper.rb:38-63`). Rails'
version does the same I18n lookup as the Array core ext:

```ruby
if options[:locale] != false && defined?(I18n)
  i18n_connectors = I18n.translate(:'support.array', locale: options[:locale], default: {})
  default_connectors.merge!(i18n_connectors)
end
```

The trails port declares `locale?: string` on `ToSentenceOptions` but never
reads it — the connectors are always the hardcoded defaults. PR #6039 fixed the
equivalent gap in `packages/activesupport/src/array-utils.ts`; this file was
out of its scope.

## Acceptance criteria

- `toSentence` in `output-safety-helper.ts` merges `support.array` from I18n
  between the hardcoded defaults and the caller's options, in
  output_safety_helper.rb's order, honouring `locale: false`.
- Ported tests in `output-safety-helper.test.ts` that work around the missing
  lookup are restored to their Rails bodies (test names unchanged).
- No new public surface beyond what output_safety_helper.rb has.
