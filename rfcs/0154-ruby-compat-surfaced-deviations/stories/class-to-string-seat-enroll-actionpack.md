---
title: "Enroll actionpack in class-to-string-seat"
status: draft
updated: 2026-10-18
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`blazetrails/class-to-string-seat` (`eslint/class-to-string-seat.mjs`, story `class-to-string-renders-ruby-module-to-s`) gives each class a `static toString()` literal holding its Ruby constant path, so a template literal interpolating the class renders like Ruby's `"#{klass}"` (`rb_mod_to_s`, `vendor/ruby/v3.3.11/object.c:1710-1742`) instead of the class source. The name comes from the `classPaths` table of `eslint/rails-file-structure-method-order.json`, which scripts/build-rails-file-structure-manifest.ts builds from rails-api.json. That table holds 223 class names for `packages/actionpack/src` today.

Enrollment is per package and only-grow, in the rule's `files` list in `eslint.config.mjs` (the block registered when the method-order manifest is ready). activejob and activesupport are enrolled.

## Acceptance criteria

- [ ] `packages/actionpack/src/**/*.ts` added to the rule's `files` list.
- [ ] `pnpm parity:api`, then `pnpm eslint --fix packages/actionpack/src`, applied and committed.
- [ ] Any `handWritten` report (an existing `static toString` that is not a bare string return) read against its Ruby `to_s` and resolved.
- [ ] `grep` shows no call site in the package relying on a seated class's source through `String(klass)` or a template literal (`Function.prototype.toString.call` is unaffected).
