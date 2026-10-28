---
title: "Give msgpack's C-defined classes and nokogiri class-path table rows so their seats can go plain"
status: claimed
updated: 2026-10-28
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-10-28T16:19:26Z"
assignee: "call-gate-credits-typed-fetch-on-plain-object-config-receivers"
blocked-by: null
closed-reason: null
---

## Context

On trails#9378, the msgpack and nokogiri seats that would lose their Ruby path
under a plain assignment were left on `rbModConstSet`, because no generated
class-path table names those classes:

- **msgpack.** The gem defines `MessagePack::UnpackError`,
  `MalformedFormatError`, `StackError`, `UnexpectedTypeError`,
  `UnknownExtTypeError` and `TypeError` in C (`ext/msgpack/unpacker_class.c`),
  so they are absent from `rails-api.json`. `ExtensionValue`, `Bigint`, `Time`
  and `CoreExt` are missing from `packages/msgpack/src/class-paths.generated.ts`
  too. Their seats are in `unpacker.ts`, `extension-value.ts`, `bigint.ts`,
  `time.ts` and `core-ext.ts`. With a plain assignment, `rbModName` answers
  `MalformedFormatError` where the gem answers
  `MessagePack::MalformedFormatError`; this was checked on the built dist.
- **nokogiri.** It has no `class-paths.generated.ts` at all, because nokogiri is
  not in the parity manifests. `XML.Node`, `NodeSet`, `Attr`, `Namespace`,
  `XPathContext` and `HTML5.Node` keep `rbModConstSet`
  (`packages/nokogiri/src/xml/*.ts`, `html5/node.ts`), seating under
  `Nokogiri::XML`.

The converged shape is that each class's Ruby fqn comes from a generated table
(RFC 0205), and the seat becomes a plain `Owner.Name = Klass`, or is deleted
where nothing reads it.

## Acceptance criteria

- [ ] The class-path generator gains a source for C-defined gem classes (msgpack's
      `ext/` classes) and enrolls nokogiri, so both packages get table rows for
      every class above.
- [ ] Each seat above becomes a plain assignment, or is deleted where unread.
- [ ] `rbModName` answers the same qualified path for each class as before,
      checked on the built dist.
- [ ] `pnpm parity:class-paths:check` passes.
