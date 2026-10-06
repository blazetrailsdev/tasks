---
title: "MessagePack unpacker raises one invented MessagePackError where the gem raises MalformedFormatError / UnknownExtTypeError"
status: draft
updated: 2026-10-06
rfc: "0184-msgpack-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/message-pack/factory.ts` stands in for the msgpack
gem's `Factory` / `Packer` / `Unpacker`. After trails#8584 a truncated payload
raises ruby-compat's `EOFError("end of buffer reached")`, as msgpack 1.8.3 does,
and `MessagePackError` extends `StandardError`, where the gem's
`MessagePack::UnpackError` sits. Every other unpack failure still raises the
single invented `MessagePackError` with an invented message:

- `Unpacker#fullUnpack`: `"<n> extra bytes after the deserialized object"`. The
  gem raises `MessagePack::MalformedFormatError` with that same message
  (checked with `MessagePack.unpack("\x01\x01")` on msgpack 1.8.3).
- `Unpacker#read` default arm: `"Unsupported MessagePack tag 0x.."`. The gem
  raises `MessagePack::MalformedFormatError` for the reserved byte `0xc1`.
- `Unpacker#readExt`: `"Unregistered MessagePack ext type <n>"`. The gem raises
  `MessagePack::UnknownExtTypeError` with `"unexpected extension type"`
  (`MessagePack.unpack("\xd4\x05\x01")`).
- `Unpacker#readMap`: `"MessagePack map keys must be strings"` has no gem
  counterpart; the gem accepts any key.
- `Packer#write` / `writeBigInt`: `"Cannot encode value of type ..."` and
  `"Integer ... requires the oversized-integer ext type"`. The gem raises
  `NoMethodError` (`to_msgpack`) and `RangeError` respectively.

The gem hierarchy is `MalformedFormatError < UnpackError < StandardError`,
`UnknownExtTypeError < UnpackError`, `StackError < UnpackError`,
`UnexpectedTypeError < UnpackError` (includes `TypeError`). The gem is not
vendored under `vendor/`; verify each class and message with `ruby` (it is on
PATH, msgpack 1.8.3 installed).

## Converged shape

`factory.ts` exports `UnpackError`, `MalformedFormatError` and
`UnknownExtTypeError` in the gem's hierarchy, each raise site uses the gem's
class and message, and `MessagePackError` is deleted (its only importers are
inside `message-pack/`).

## Acceptance criteria

- [ ] No `MessagePackError` in `packages/`.
- [ ] Each unpack failure above raises the gem's class with the gem's message,
      pinned by a `.trails.test.ts` case whose expected class and message were
      read off `ruby`.
- [ ] The packer's two raises use the gem's classes, or are filed separately
      with the reason they cannot.
