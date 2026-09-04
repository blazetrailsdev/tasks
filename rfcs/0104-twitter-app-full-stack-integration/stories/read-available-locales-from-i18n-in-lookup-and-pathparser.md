---
title: "LookupContext and PathParser hardcode the locale detail instead of reading I18n"
status: ready
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails builds the locale alternation in a template path's regex from the app's
configured locales:

```ruby
# vendor/rails/actionview/lib/action_view/template/resolver.rb:19-21
available_locales = I18n.available_locales.map(&:to_s)
regular_locales = [/[a-z]{2}(?:[-_][A-Z]{2})?/]
locales = Regexp.union(available_locales + regular_locales)
```

trails' `PathParser#buildPathRegex`
(`packages/actionview/src/template/resolver.ts`) ships only the generic half,
with the cite in place:

> I18n is unported, so `available_locales` contributes nothing to the locale
> union and only Rails' generic shape is left.

The same gap is upstream of it in `LookupContext`
(`packages/actionview/src/lookup-context.ts`), whose locale detail is a
hardcoded default:

```ts
// I18n is not yet ported; fall back to a single "en" locale.
registerDetail("locale", () => ["en"]);
```

`@blazetrails/i18n` exists and scores 281/281, so both can now read the real
thing. Until they do, a locale outside the two-letter shape — Rails registers
whatever `I18n.available_locales` holds — will not parse off a template
filename, and a lookup in a non-`en` locale never matches a localized
template.

## Converged shape

`registerDetail("locale", ...)` reads `I18n.locale`, and `buildPathRegex`
unions `I18n.availableLocales` with the generic shape (`resolver.rb:19-21`).

## Acceptance criteria

- `LookupContext`'s locale detail comes from `@blazetrails/i18n`, not `["en"]`.
- `PathParser`'s locale group unions the available locales with the generic
  shape, and `clearCache` rebuilds it so a locale registered later is picked up
  (`resolver.rb:100-104`).
- A template named `show.pt-BR.html.tse` resolves when the locale is `pt-BR`.
