---
title: "msgpack: CoreExt#to_msgpack sends to_msgpack_with_packer instead of calling it"
status: draft
updated: 2026-10-20
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`MessagePack::CoreExt#to_msgpack` (`vendor/msgpack/v1.8.0/lib/msgpack/core_ext.rb:6`) is
`to_msgpack_with_packer packer_or_io` — a call to a sibling method on `self`.

trails spells it `rbFSend(this, "toMsgpackWithPacker", packerOrIo)`
(`packages/msgpack/src/core-ext.ts:25`), because `CoreExt` is a plain-object module whose
`toMsgpack` takes `this: unknown`, so `this.toMsgpackWithPacker(...)` does not type-check. The
name is a literal, so CLAUDE.md § "A dispatch by name is spelled directly" makes the direct
call the ported shape; the host-typing fix is the same shape as RFC 0198's mixin host typing.

Surfaced while building the literal-name send ratchet (trails#9143), which freezes the count
but does not converge this site. The pair shows twice in the call report because the module
defines the method for two host kinds.

## Converged shape

`toMsgpack`'s `this` is typed with a host interface carrying `toMsgpackWithPacker`, and the
body calls `this.toMsgpackWithPacker(packerOrIo)` directly, with no `rbFSend`.

## Acceptance criteria

- [ ] `core-ext.ts` calls `this.toMsgpackWithPacker(...)` through a typed host, no `rbFSend`.
- [ ] The existing msgpack core-ext tests stay green for every host kind the module serves.
- [ ] `pnpm parity:api:sends` total drops; `pnpm parity:api:calls` stays green.
