---
title: "rails-error-parity's $! exemption is keyed by package and bare class name"
status: draft
updated: 2026-10-07
rfc: "0182-activerecord-error-parity"
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

trails#8625 taught `blazetrails/rails-error-parity`'s `inventedMessage` arm
(`eslint/rails-error-parity.mjs`) to accept `throw new X(error)` inside the
`catch (error)` it names when Rails' `X#initialize` reads `$!`, as
`ActionDispatch::Session::SessionRestoreError` does
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/session/abstract_store.rb:13-20`).
`scripts/parity/rails-bare-raises.rb` records those classes, and
`scripts/build-rails-error-manifest.ts` writes them to the `errinfo` key of
`eslint/rails-error-classes.json`.

`errinfo` is keyed by package and bare class name. The current rows are
`StatementInvalid` (activerecord), `BadRequest`, `ParseError`,
`SessionRestoreError` (actionpack) and `Error` (actionview). A second class of
the same last segment anywhere in the package is exempt too, in every method.

## Acceptance criteria

- [ ] An `errinfo` row names the class by its full Ruby path, and the rule
      matches a throw site to it by the TS file the class is imported from, or
      by the manifest's own class-to-file map.
- [ ] A same-named class whose `initialize` does not read `$!` is flagged when
      it is thrown with the rescued exception where Rails raises it bare.
