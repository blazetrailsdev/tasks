---
title: "RotationCoordinator models a Ruby Symbol salt as a JS Symbol"
status: draft
updated: 2026-08-04
rfc: "0082-ruby-ts-idiom-conversion-classes"
cluster: null
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

`packages/activesupport/src/messages/rotation-coordinator.ts` types a codec salt
as `export type Salt = string | symbol` and `RotationCoordinator#get` /
`#set` accept a JS `Symbol`. `rotation_coordinator.rb:82,84` does
`@codecs[salt] ||= ... build(salt.to_s, **options)` — a Ruby Symbol, which the
repo convention models as a colon-prefixed STRING (`":salt"`), never a JS
`Symbol`. CLAUDE.md: "A Ruby Symbol is a JS string, never a JS `Symbol`. JS
`Symbol` / `Symbol.for` is reserved for private keys and brands."

Surfaced while retiring the RotationCoordinator harness (PR #6096): the TS-only
case `stringifies a symbol salt before building` (now in
`packages/activesupport/src/message-verifiers.trails.test.ts`) drives the
divergence with `coordinator.get(Symbol.for("salt"))`.

## Converged shape

`Salt` is `string`. `salt.to_s` (rotation_coordinator.rb:82,84) becomes the
colon-strip the rest of the port uses (`salt.startsWith(":") ? salt.slice(1) :
salt`), so `get(":salt")` builds against `"salt"` exactly as Ruby does, and the
`#codecs` map keys on the salt as given. Update the trails test to pass `":salt"`
rather than `Symbol.for("salt")`; the assertion (`salts` sees `"salt"`) is
unchanged.

Check the `rotate` block arm too: `RotateBlock = (salt: Salt) => ...`
(rotation_coordinator.rb:35 `@rotate_options << block`) passes the salt in its
ORIGINAL form, so the block must see `":salt"`, not the stripped name.

## Acceptance criteria

- No `symbol` in `rotation-coordinator.ts`'s public types.
- `message-verifiers.trails.test.ts`'s symbol-salt case passes with `":salt"`.
- `pnpm parity:api` stays 11/11 for `messages/rotation_coordinator.rb`.
