---
title: "activemodel: Binary::Data#initialize and #== re-derive to_s / b / == over a Uint8Array seat"
status: in-progress
updated: 2026-10-02
rfc: "0173-activemodel-parity-100"
cluster: arms
packages: ["activemodel", "ruby-compat"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#8413
claim: "2026-10-02T17:42:02Z"
assignee: "activemodel-binary-data-byte-seat-invents-arms"
blocked-by: null
closed-reason: null
---

## Context

Left over from `activemodel-converge-invented-control-flow-arms-type`. `packages/activemodel/src/type/binary.ts` reports two rows in `pnpm parity:api:arms:report --package=activemodel --direction=invented`: `Data#constructor` (`+if`) and `Data#equals` (`+if +if +if +if +loop +if`).

Rails (`vendor/rails/v8.0.2/activemodel/lib/active_model/type/binary.rb:40-59`):

    def initialize(value)
      value = value.to_s
      value = value.b unless value.encoding == Encoding::BINARY
      @value = value
    end

    def ==(other)
      other == to_s || super
    end

`@value` is a binary String. The port seats it as a `Uint8Array` in a `bytes` field, so each body re-derives by hand what Ruby gets from `to_s`, `String#b` and `String#==`: the constructor is an `instanceof Data` / `instanceof Uint8Array` chain, and `equals` is a second chain over the same three seats plus a byte-by-byte loop.

`@blazetrails/ruby-compat` already has `b` (`packages/ruby-compat/src/string/b.ts`) and `Encoding`, but they are defined over a JS string, not over the `Uint8Array` the adapters hand in. So the blocker is the seat: either `Data` holds what `b` returns and the drivers convert at their own boundary, or `to_s` / `b` / `rbEqual` learn the `Uint8Array` seat. Once that is decided the two bodies are three lines and one line.

`binary-cast-drops-the-already-binary-arm` (closed, premise falsified) is about `Binary#cast`, not about `Data`; it is not prior art for this.

## Acceptance criteria

- [ ] `Data#constructor` is `to_s`, then one `unless … BINARY` arm, then the assignment.
- [ ] `Data#equals` is `other == to_s || super` with no loop.
- [ ] `pnpm parity:api:arms:report --package=activemodel --direction=invented` shows no row for `type/binary.ts`.
