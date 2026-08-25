---
title: "make-transliterate-raise-on-non-strings"
status: done
updated: 2026-08-17
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6621
claim: "2026-08-16T23:40:00Z"
assignee: "make-transliterate-raise-on-non-strings"
blocked-by: null
closed-reason: null
---

## Context

`Inflector.transliterate` (`vendor/rails/activesupport/lib/active_support/inflector/transliterate.rb:65-66`)
opens by raising:

```ruby
raise ArgumentError, "Can only transliterate strings. Received #{string.class.name}" unless string.is_a?(String)
```

trails' port (`packages/activesupport/src/transliterate.ts`) instead returns
`""` for `null`/`undefined` and `String(x)` for anything else. PR #6564 gave the
function its `locale:` arm and its I18n lookup but deliberately left this arm
alone — it is a separate behavioural divergence, and flipping it changes every
caller that leans on the tolerance (e.g.
`actiondispatch/http/content-disposition.ts:34` already guards with `?? ""`).

The two Rails tests are already present in
`packages/activesupport/src/transliterate.test.ts` at their verbatim names —
`transliterate handles nil` and `transliterate handles unknown object` — but
assert the trails behaviour (`""` and `"42"`) rather than Rails'
`assert_raises ArgumentError` with the exact message
(`transliterate_test.rb:47-58`).

## Acceptance criteria

- [ ] `transliterate` raises `ArgumentError` with Rails' verbatim message for a
      non-string argument.
- [ ] The two tests above carry Rails' `assert_raises` assertions, including the
      message string, and fail on the pre-change tree.
- [ ] Every caller in the monorepo that relied on the tolerance is audited and
      passes a string.
