---
title: "Compare: public_send / private_methods / protected_methods / public_method_defined? are one permanent SKIP_GROUPS entry"
status: draft
updated: 2026-10-16
rfc: "0000-ruby-compat-native-first"
cluster: gate
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The Ruby visibility-reflection calls are scattered across the compare
tables:

- `public_send` and `send` are in a generic "Ruby core object methods" `SKIP_GROUPS` entry (`scripts/parity/conventions.ts:545-569`).
- `respond_to?` is in the per-class protocol group (`:590-595`).
- `public_method_defined?`, `private_method_defined?`, `protected_method_defined?`, `public_methods`, `private_methods`, `protected_methods`, `public_instance_methods` and `public_instance_method` have no ratified entry.

After the collapse story deletes `rbFPublicSend`, `rbObjPrivateMethods`,
`rbObjProtectedMethods`, `rbObjPublicMethods` and `rbModPublicMethodDefined`,
the Rails bodies that call these (Thor `command.rb`, `mapper.rb:198-204`,
`relation/delegation.rb:19`) must not read as missing calls.

## Acceptance criteria

- [ ] One `SKIP_GROUPS` / scoped entry, `PERMANENT`, with the reason citing CLAUDE.md § "Method visibility is compile-time only". It lists the visibility-reflection names, and `send` / `public_send` move into it.
- [ ] `RUBY_COMPAT_EXPORTS` (`scripts/parity/ruby-compat.ts`) gains no row for them, and its `Kernel#send` row is handled by `ruby-compat-table-drops-kernel-send`.
- [ ] `docs/ruby-ts-conventions.md` is regenerated. `pnpm parity:api` deltas are non-negative.
