---
title: "Route Backend::Base#resolve through the I18n.translate facade"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6093
claim: "2026-08-04T21:11:10Z"
assignee: "i18n-date-parse-eu-us-gate-misses-have-digit"
blocked-by: null
closed-reason: null
---

## Context

`Base#resolve` resolves a Symbol subject by calling the configured backend
directly:

```ts
// packages/i18n/src/backend/base.ts — resolve()
return config().backend.translate(locale, symbolName(subject), {
  ...options,
  locale,
  throw: true,
  skipInterpolation: true,
});
```

Rails goes through the facade instead, at
`vendor/i18n/lib/i18n/backend/base.rb:150-156`:

```ruby
I18n.translate(subject, **options.merge(:locale => locale, :throw => true,
                                        :skip_interpolation => true))
```

The two agree today only because `I18n.translate` with `throw: true` hands a
`MissingTranslation` straight back to the enclosing `catch(:exception)`
(`i18n.rb:393-403`). They stop agreeing as soon as the facade does anything
else — `enforce_available_locales!` (`i18n.rb:218`), the Array-key branch
(`i18n.rb:224-230`), and `Disabled` on `locale == false` (`i18n.rb:220`) are all
skipped by the direct call.

The facade did not exist when `base.ts` was ported; it has since landed with
[[i18n-facade-translate-interpolate]] (PR #6000, merged), so this story is
unblocked.

## Acceptance criteria

- `Base#resolve` calls the ported `I18n.translate` facade, not
  `config().backend.translate`, with the same three merged options.
- The `as unknown as`-free `translate` member added to the `Backend` interface
  in `config.ts` is re-examined: if only `resolve` needed it, drop it back to
  the slice `Config` itself calls.
- A test covers a Symbol default resolving under a locale that
  `enforceAvailableLocales` would reject, proving the guard now runs.
