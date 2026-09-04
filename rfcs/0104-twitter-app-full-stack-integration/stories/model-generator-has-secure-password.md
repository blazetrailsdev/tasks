---
title: "model-generator-has-secure-password"
status: ready
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 50
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`model.rb.tt`
(`vendor/rails/activerecord/lib/rails/generators/active_record/model/templates/model.rb.tt`)
closes with

```erb
<% if attributes.any?(&:password_digest?) -%>
  has_secure_password
<% end -%>
```

where `password_digest?` is `name == "password" && type == :digest`
(`vendor/rails/railties/lib/rails/generators/generated_attribute.rb:204-206`).

`packages/trailties/src/generators/model-generator.ts` emits the other five
template passes (`belongs_to`, `has_rich_text`, `has_one_attached`,
`has_many_attached`, `has_secure_token`, converged in #7353) but not this one,
because `digest` is not a member of `ColumnType`
(`packages/trailties/src/generators/base.ts:124-139`), so
`parseColumnsDefaultString` cannot recognise `password:digest` and the
migration generator has no mapping for it either.

`hasSecurePassword` itself exists (`packages/activerecord/src/secure-password.ts`).

## Acceptance criteria

- `digest` joins `ColumnType`, and the migration generator maps it to the
  `password_digest` string column Rails' `GeneratedAttribute#column_name`
  produces (`generated_attribute.rb`).
- `trails generate model User password:digest` emits `this.hasSecurePassword();`
  as the last line of the generated body, matching `model.rb.tt`'s order.
- Generator tests cover both halves.
