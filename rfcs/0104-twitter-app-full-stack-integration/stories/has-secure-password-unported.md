---
title: "has_secure_password is unported, so apps hand-roll password hashing"
status: draft
updated: 2026-08-13
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

There is no `has_secure_password`, so an app cannot authenticate a user
without writing its own password hashing.

`grep -rn "hasSecurePassword" packages/` finds only the authentication
generator's comment stub
(`packages/trailties/src/generators/rails/authentication/authentication-generator.ts:36`):

```ts
stub("associations", "// hasSecurePassword; hasMany sessions, dependent: destroy", {
  static: true,
}),
```

Nothing implements it. There is no bcrypt binding and no
`authenticate`/`password=`/`password_confirmation` surface on `Base`.

Rails: `vendor/rails/activemodel/lib/active_model/secure_password.rb` —
`has_secure_password` defines `password=`, `password_confirmation=`,
`authenticate` (aliased per attribute), the `password_digest` presence and
confirmation validations, and the 72-byte bcrypt length validation.
`ActiveRecord::Base` picks it up through `ActiveModel::SecurePassword`.

`examples/twitter-app` works around it with a salted SHA-256 in
`src/app/controllers/users-controller.ts#digestPassword`, marked as not a
production password scheme.

## Acceptance criteria

- `ActiveModel::SecurePassword` ported: `hasSecurePassword()` on the model
  class defining `setPassword`, `setPasswordConfirmation`, and
  `authenticate`, with Rails' validations.
- Backed by bcrypt with Rails' cost defaults, and the 72-byte limit enforced.
- `User.authenticateBy({ handle, password })` works, since the authentication
  generator's `SessionsController#create` is written against it.
- `examples/twitter-app` drops `digestPassword` and its `TODO`.
