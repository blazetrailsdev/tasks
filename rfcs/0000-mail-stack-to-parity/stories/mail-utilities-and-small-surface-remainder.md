---
title: "Port Mail::Utilities' remaining members, IndifferentHash's predicates, VERSION and the mb_chars utilities specs"
status: draft
updated: 2026-11-09
rfc: "0000-mail-stack-to-parity"
cluster: null
packages:
  - "mail"
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`utilities.rb` 46/56 misses `StrictCharsetEncoder#encode`, `charset_encoder(=)`,
`escape_paren`, `paren`, `bracket`, `has_constant?`, `get_constant`,
`uri_parser`, `pick_encoding` (`vendor/mail/2.8.1/lib/mail/utilities.rb`).
`indifferent_hash.rb` 21/24 misses `has_key?`, `member?`, `fetch`;
`version.rb` 0/1 misses `Mail::VERSION.version`.
`spec/mail/utilities_spec.rb` misses 11 tests: the `should work with mb_chars`
cases (:20, :35, :54, :69), `should quote mb_chars white space` (:74), the
`Multibyte.mb_chars` cases (:145-178), and two `returns Strings` (:476, :521).
`has_constant?` / `get_constant` are `const_defined?` / `const_get`; port them
by CLAUDE.md § "Constant lookup is an import or a registry".

## Acceptance criteria

- [ ] Each listed member is ported at its Ruby name in its Ruby file.
- [ ] The 11 utilities specs are ported by name in `packages/mail/test/utilities.test.ts`.
