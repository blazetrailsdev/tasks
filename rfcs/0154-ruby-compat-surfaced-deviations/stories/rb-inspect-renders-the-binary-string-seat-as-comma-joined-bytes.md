---
title: "ruby-compat: rbInspect renders a Uint8Array binary String as comma-joined bytes, not rb_str_inspect"
status: draft
updated: 2026-10-02
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8413, which made a `Uint8Array` the binary String seat in `rbObjAsString` and `rbEqual` (`packages/ruby-compat/src/object.ts`, `rb-equal.ts`).

`rbInspect` does not know the seat. `inspectValue` (`packages/ruby-compat/src/object.ts`) falls through to `String(value)` for a `Uint8Array`, so `rbInspect(new Uint8Array([0x80, 0x81]))` is `"128,129"`. Ruby's `"\x80\x81".b.inspect` is `"\"\\x80\\x81\""` (`rb_str_inspect`, `vendor/ruby/v3.3.11/string.c`), and it is what `rb_obj_inspect` renders for `Binary::Data`'s `@value`.

## Acceptance criteria

- [ ] `rbInspect` renders a `Uint8Array` as `rb_str_inspect` renders an ASCII-8BIT String: quoted, printable ASCII as it is, every other byte as `\xNN`.
- [ ] `rbInspect(new BinaryData(bytes))` shows `@value` in that form.
- [ ] Tests in `object.trails.test.ts`, with the expected strings taken from `ruby -e`.
