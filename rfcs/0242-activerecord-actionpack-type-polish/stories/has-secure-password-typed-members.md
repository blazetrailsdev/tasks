---
title: "has-secure-password-typed-members"
status: in-progress
updated: 2026-11-19
rfc: "0242-activerecord-actionpack-type-polish"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10350
claim: "2026-11-19T11:01:32Z"
assignee: "activesupport-types-class-level-mixins-remainder"
blocked-by: null
closed-reason: null
---

## Context

`hasSecurePassword` (`packages/activemodel/lib/secure-password.ts`, Rails
`activemodel/lib/active_model/secure_password.rb:104-170`) installs `password`,
`passwordConfirmation`, `authenticate` / `authenticate<Attr>` and `<attr>Salt`
at run time through `InstanceMethodsOnActivation`. Nothing surfaces them on the
type side, so test models cast: `packages/activemodel/test/models/user.ts:12-17`
(`Model as unknown as { new(...): Model & { password } }`), and similar in
`pilot.ts`, `visitor.ts`.

## Acceptance criteria

- [ ] A typed instance-member surface for `hasSecurePassword` (e.g. an exported
      `SecurePassword.InstanceMethodsOnActivation` interface the model merges)
      so `test/models/user.ts` & co. drop their `as unknown as` cast.
- [ ] No wrapper or renamed Rails method; members keep Rails names.
