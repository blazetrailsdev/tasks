---
title: "i18n resolveEntry ignores the options[:object] proc-subject override"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already done: packages/i18n/src/backend/base.ts:537-546 resolves the proc subject as options.object ?? object and deletes the key, mirroring base.rb:150-172."
---

## Context

`packages/activesupport/src/i18n.ts` gained a `resolveEntry` helper in #5954,
porting the `Proc` arm of i18n's `Backend::Base#resolve`
(`vendor/i18n/lib/i18n/backend/base.rb:150-172`). Rails invokes the proc as:

```ruby
when Proc
  date_or_time = options.delete(:object) || object
  resolve(locale, object, subject.call(date_or_time, **options))
```

trails passes `key` unconditionally and never consults `options[:object]`, so a
caller cannot override the subject handed to a locale proc. Inert for
`number.nth.ordinals`/`ordinalized` (both ignore the first argument), but a
divergence for any future date/time locale proc, which is precisely what the
`:object` override exists for.

Note the Ruby is `options.delete(:object)` — the key is consumed, so it is not
also passed through in the `**options` splat.

## Acceptance criteria

- `resolveEntry` resolves the proc subject as `options.object ?? key`, and
  removes `object` from the options passed to the proc, mirroring
  `options.delete(:object)`.
- A test covers both arms (with and without an `object` option).
- Existing i18n and inflector tests keep passing unchanged.
