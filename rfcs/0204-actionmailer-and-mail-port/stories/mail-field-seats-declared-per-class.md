---
title: "mail-field-seats-declared-per-class"
status: draft
updated: 2026-11-02
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
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

`vendor/mail/2.8.1/lib/mail/field.rb:2` is `require 'mail/fields'`, so `Mail::ToField` always resolves. In trails each field class seats itself on `Mail` at the bottom of its file, and `packages/mail/src/field.ts` reads the seat at call time. `packages/mail/src/mail.ts` types the seats as a template-key `Record<`${string}Field`, FieldConstant>`, not a declared property per class (CLAUDE.md § "Call-time constant resolution"), and `field.ts` casts the map. `./field`, `./field-list` and `./header` are closed in package exports, but `./*` still reaches `./fields/*`, and a deep entry can miss seats.

## Acceptance criteria

- `Mail` declares each field constant with its class type, and the casts in `field.ts` go.
- A plain-node import of each built field module as the entry resolves `Field.FIELDS_MAP` to real classes, or that entry is closed in exports.
