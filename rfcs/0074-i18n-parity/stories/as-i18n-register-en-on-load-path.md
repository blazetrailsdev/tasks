---
title: "Register Active Support's en locale on I18n.load_path"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6017
claim: "2026-08-03T20:17:09Z"
assignee: "as-i18n-register-en-on-load-path"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/i18n.ts:23` (merged in #6008) stores the `en`
locale straight into the backend:

```ts
I18n.backend().storeTranslations("en", en);
```

Rails does not. `activesupport/lib/active_support/i18n.rb:16-17` appends the two
locale files to the load path:

```ruby
I18n.load_path << File.expand_path("locale/en.yml", __dir__)
I18n.load_path << File.expand_path("locale/en.rb", __dir__)
```

and `I18n::Backend::Simple#init_translations`
(`vendor/i18n/lib/i18n/backend/simple.rb:83-86`) calls `load_translations` on
first use and after every `I18n.reload!`. The direct store was justified at the
call site because the file-loading lane was unported; that lane has since landed
(`i18n-backend-file-loading-localize`, done), so the justification no longer
holds.

Observable divergence: `I18n.reloadBang()` drops Active Support's `date`,
`time`, `support` and `number` translations permanently, which is why
`packages/activesupport/src/i18n.test.ts` and `number-helper-i18n.test.ts` carry
a `reloadTranslations()` helper that re-stores `en` by hand. Rails needs no such
helper.

## Converged shape

`src/i18n.ts` appends the locale module to `I18n.loadPath` and does nothing
else; `Simple#initTranslations` loads it, and `reloadBang()` re-loads it. The
`en.rb` half is a JS module exporting a hash — check what `load_rb` maps onto in
the shipped loader (dynamic `import()` vs a registered value) and follow it.
Both test helpers then delete.
