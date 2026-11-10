---
title: "Port Mail::Utilities.has_constant? / get_constant, IndifferentHash's has_key? / member? / fetch, VERSION, and the mb_chars utilities specs"
status: in-progress
updated: 2026-11-10
rfc: "0226-mail-stack-to-parity"
cluster: null
packages:
  - "mail"
deps:
  - "mail-parity-api-credits-object-literal-modules"
deps-rfc: []
est-loc: 250
priority: 2
pr: trails#9958
claim: "2026-11-10T16:12:05Z"
assignee: "rake-file-utils-ext-flags-and-output-helpers"
blocked-by: null
closed-reason: null
---

## Context

`utilities.rb` is 46/56, but most of the misses already exist in the
`Utilities` object literal and are the credit gap that
`mail-parity-api-credits-object-literal-modules` closes:
`StrictCharsetEncoder#encode` (`packages/mail/lib/utilities.ts:40`),
`charset_encoder`, `escape_paren` (:241), `paren`, `bracket`, `uri_parser`
(:139) and `pick_encoding`. Truly unported are `has_constant?` and
`get_constant` (`vendor/mail/2.8.1/lib/mail/utilities.rb`), which are
`const_defined?` / `const_get` and port by CLAUDE.md § "Constant lookup is an
import or a registry".
`indifferent_hash.rb` 21/24: `isKey` exists (`indifferent-hash.ts:57`), but
`has_key?`, `member?` and `fetch` do not. `version.rb` 0/1: `Mail::VERSION.version`.
`spec/mail/utilities_spec.rb` misses 11 tests: the `should work with mb_chars`
cases (:20, :35, :54, :69), `should quote mb_chars white space` (:74), the
`Multibyte.mb_chars` cases (:145-178), and two `returns Strings` (:476, :521).

## Acceptance criteria

- [ ] `isHasConstant` / `getConstant`, `IndifferentHash#isHasKey` / `isMember` /
      `fetch` and `VERSION.version` are ported at their Ruby files.
- [ ] After `mail-parity-api-credits-object-literal-modules`, `pnpm parity:api`
      shows `utilities.rb`, `indifferent_hash.rb` and `version.rb` complete.
- [ ] The 11 utilities specs are ported by name in `packages/mail/test/utilities.test.ts`.
