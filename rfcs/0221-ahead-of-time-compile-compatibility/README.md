---
rfc: "0221-ahead-of-time-compile-compatibility"
title: "Ahead-of-time compile compatibility: what a whole-program compiler needs that Node does not"
status: draft
created: 2026-11-04
updated: 2026-11-04
owner: "@deanmarano"
packages:
  - activesupport
  - activerecord
  - actionpack
  - trailties
  - actioncable
  - activestorage
  - image-processing
  - i18n
  - rack
  - rake
  - builder
  - mini-magick
clusters:
  - proxy-install
  - optional-deps
related-rfcs:
  - "0192-package-entry-point-boot-cost"
  - "0093-proxy-dynamic-method-consistency"
---

# RFC 0221 — Ahead-of-time compile compatibility

## Summary

Compiling the trails boot graph with [perry](https://github.com/PerryTS/perry),
an AOT TypeScript→native compiler, has surfaced a class of defect that Node
cannot surface. The work lives in trails at `examples/perry-native/perry/`, and
its running log is `FINDINGS.md` there; 21 distinct boot failures ("walls") have
been characterised so far and most are fixed.

This RFC collects the ones that are **trails' own design to settle**, not the
compiler's bugs to wait on. Each has the same shape: the code is correct under
Node, and correct-looking under review, but it relies on a runtime property that
a whole-program compiler does not provide.

Two properties account for everything found so far:

1. **A constructor may not return a different object.** V8 tolerates installing
   a private class field on an object returned from a base constructor; an AOT
   runtime need not, and perry refuses outright. 20 classes return a `Proxy`
   from their constructor to emulate Ruby's `method_missing`.
2. **Laziness is not reachability.** A dynamic `import()` with a literal
   specifier is still a static edge to a compiler that must emit everything
   reachable. Being lazy keeps a module out of Node's boot; it does not keep it
   out of a binary.

## This is not RFC 0192

0192 measures what importing one binding costs and says explicitly that making
perry compile a full trails app is "not the motivation here". That remains true:
0192 is about boot cost on Node, this is about whether a whole-program compiler
can emit the program at all. They touch the same packages and are otherwise
unrelated.

## Why fix these in trails

In every case the AOT-safe form is also the better form on Node:

- A constructor that returns a different object breaks private fields,
  `instanceof` narrowing, and subclass construction for every subclass, on any
  runtime. Ruby's `method_missing` lives on the class and is reached through the
  ancestor chain, so installing the handler in the prototype chain is also the
  closer port. 7 sites already do it that way, including
  `activerecord/src/base.ts` and `relation.ts`.
- An optional peer dependency that an app did not ask for should not be
  reachable from that app's code, whether or not the reachability is paid for at
  boot.

Neither is a compiler workaround, which is the bar: a change that exists only to
please a compiler belongs upstream in the compiler, not here.

## Out of scope

- **Perry's own defects.** Several walls are compiler bugs and are being
  reported upstream; they are tracked in `FINDINGS.md`, not here. A trails
  change whose only justification is a compiler bug is explicitly not wanted —
  one such change was made and reverted on 2026-11-04 after the bug turned out
  to be fixed upstream already.
- **Making the ladder green.** This RFC is the trails-side design debt the
  ladder exposed. Getting the binary to boot is prototype work in
  `examples/perry-native`.
