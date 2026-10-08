---
title: "eslint: @inlinedFrom is valid only on a constructor and only names #initialize"
status: draft
updated: 2026-10-08
rfc: "0186-module-initialize-inlined-into-constructors"
cluster: tooling
packages: ["scripts"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0186 § Design: a module's `initialize` is inlined into the constructor of each class that includes or prepends it, at the position Ruby's `super` occupies, and the constructor carries one `@inlinedFrom Module#initialize` tag per segment in chain order.

arel's `inlined-from` bucket names the general case (a module member whose body sits on an including class's file) and pins it at 0. The tag must not become a way to admit that. `eslint/no-freeform-comments.mjs` holds the allowlist of recognised markers and has to learn this one so it is not stripped.

## Acceptance criteria

- A rule under `eslint/` reports `@inlinedFrom` on any declaration that is not a class constructor.
- It reports a value that does not end in `#initialize`, and a value followed by prose.
- `no-freeform-comments` leaves a well-formed tag alone; its test file covers it.
- The rule is registered in `eslint.config.mjs` and mirrored into `eslint/rails-private-jsdoc.config.mjs` if that config's ignores require it.
- The accepted shape is the name followed by one versioned citation with no `vendor/` prefix; `no-freeform-comments` admits that shape and nothing after it.
- The hooks the tag may cite are a closed list in the rule: `Module#initialize` and `Mod::ClassMethods#new`. A class's own `Klass.new` is not on it and is an error to cite. Adding an entry is a reviewed change to that list.
