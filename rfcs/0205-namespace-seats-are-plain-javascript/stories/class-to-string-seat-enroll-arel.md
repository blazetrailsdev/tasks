---
title: "Enroll arel in class-to-string-seat"
status: closed
updated: 2026-10-29
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 544
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "FALSIFIED: duplicates the class -> Ruby name table ruby-compat already generates (RFC 0205 README, 2026-10-29); a hand-seeded path literal per class is the registration protocol this RFC removes."
---

## Context

`blazetrails/class-to-string-seat` (`eslint/class-to-string-seat.mjs`, story `class-to-string-renders-ruby-module-to-s`) gives each class a `static toString()` literal holding its Ruby constant path, so a template literal interpolating the class renders like Ruby's `"#{klass}"` (`rb_mod_to_s`, `vendor/ruby/v3.3.11/object.c:1710-1742`) instead of the class source. The name comes from the `classPaths` table of `eslint/rails-file-structure-method-order.json`, which scripts/build-rails-file-structure-manifest.ts builds from rails-api.json. That table holds 136 class names for `packages/arel/src` today.

Enrollment is per package and only-grow, in the rule's `files` list in `eslint.config.mjs` (the block registered when the method-order manifest is ready). activejob and activesupport are enrolled.

`rails-file-structure-method-order` is enrolled for this package and keeps a member Rails does not declare after the mapped block, so a seat inserted first may be moved by that rule. Decide the order the two rules agree on before sweeping (a Ruby `def self.to_s` is a mapped member; a seat is not).

## Acceptance criteria

- [ ] `packages/arel/src/**/*.ts` added to the rule's `files` list.
- [ ] `pnpm parity:api`, then `pnpm eslint --fix packages/arel/src`, applied and committed.
- [ ] Any `handWritten` report (an existing `static toString` that is not a bare string return) read against its Ruby `to_s` and resolved.
- [ ] `grep` shows no call site in the package relying on a seated class's source through `String(klass)` or a template literal (`Function.prototype.toString.call` is unaffected).
