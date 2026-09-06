---
title: "A missing helper constant raises without a did-you-mean suggestion"
status: draft
updated: 2026-09-06
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Resolving a helper by a name that does not exist raises a bare `NameError` with
no suggestion. `packages/actionpack/src/abstract-controller/helpers.ts:182`:

```ts
if (!mod) throw new NameError(`uninitialized constant ${name}`, demodulize(name));
```

Rails raises the same message but attaches a did-you-mean suggestion to the
DETAILED message, and tests exactly that —
`vendor/rails/actionpack/test/controller/helper_test.rb:87-93`:

```ruby
def test_helper_typo_error_message
  e = assert_raise(NameError) { HelpersTypoController.helper "admin/users" }
  assert_includes e.message, "uninitialized constant Admin::UsersHelper"
  assert_includes e.detailed_message, "Did you mean?  Admin::UsersHelpeR"
end
```

`@blazetrails/did-you-mean` is already a dependency and already wired into
actionpack for other suggestions —
`packages/actionpack/src/abstract-controller/base.ts` (action names) and
`packages/actionpack/src/action-controller/metal/strong-parameters.ts` — so
this is a matter of feeding the candidate list at an existing seam, not new
infrastructure.

The candidates are available at the raise site: blazetrailsdev/trails#7558
landed the constant table that `resolve` reads, so the set of helper constant
names the app actually has is known when the lookup fails. Rails gets its
candidates from the constant namespace; trails' equivalent is that table.

Found while porting `modulesForHelpers` in #7558, whose own typo test asserts
only `message` because there is no `detailedMessage` to assert on yet.

## Converged shape

`NameError` carrying a detailed message with the did-you-mean suggestion,
computed from the helper constant names the resolver knows about, so
`modulesForHelpers` raising for `admin/users` suggests `Admin::UsersHelpeR`
when that is what the app defines. Check first whether trails' `NameError`
(activesupport) has a `detailedMessage` concept at all — if not, that is part
of this story and should be ported at Ruby's name.

## Acceptance criteria

- `test_helper_typo_error_message` is ported under its Rails name, asserting
  both the message and the detailed message.
- The suggestion is computed from the application's own helper constants, not a
  hardcoded list.
- A failed lookup with no near miss still raises the plain
  `uninitialized constant <Name>` message unchanged.
