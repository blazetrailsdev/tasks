---
title: "Delete sendInternal's name-guessing arms that no computed-name caller reaches"
status: ready
updated: 2026-10-25
rfc: "0194-ruby-compat-native-first"
cluster: send
packages: ["ruby-compat", "scripts"]
deps:
  [
    "native-respond-to-and-send-literal-name-sites",
    "triage-send-name-guessing-stories-against-the-direct-call-rule",
    "collapse-visibility-variants-of-send-and-respond-to",
  ]
deps-rfc: []
est-loc: 300
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

CLAUDE.md § "A dispatch by name is spelled directly" names the name guessing
in `sendInternal` (`packages/ruby-compat/src/object.ts:1182`) as machinery not
to widen: `camelized` / `writerSpelling` (`:750-757`), the `foo?` → `isFoo`
predicate spelling (`:1187`), and the `RELOPS` / operator arms (`:1189-1205`).
`checkDefinitionVisibility` (`:759`) and `basicObjRespondTo` (`:650`) repeat
the writer guess.

Measured on trails `637fa04f91`:

- `pnpm parity:api:sends` is OK at 143 literal-name sends in 102 files. Of the
  143 literal names, exactly one is spelled in Ruby (`?`, `=` or an operator).
  The other 142 are TS spellings, and 63 of them are `"call"`.
- Package source makes 296 `rbFSend` / `rbFPublicSend` calls, so about 153
  have a computed name.

Once 0194's `native-respond-to-and-send-literal-name-sites` has spelled the
literal sends directly, the guessing serves only computed names. CLAUDE.md's
open-set floor is:

- `Object#try`
  (`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/object/try.rb:14-15`);
- `MimeResponds::Collector#any` (`action_controller/metal/mime_responds.rb:262-264`);
- `Channel::Base#dispatch_action` (`action_cable/channel/base.rb:280-286`);
- `ActiveModel::AttributeAssignment#_assign_attribute`'s `"#{k}="`
  (`packages/activemodel/src/attribute-assignment.ts:77-80`).

The `x=` → setter / `setX` arm serves `_assign_attribute` for application
attribute names. `setX` is the ratified spelling of an async Ruby writer
(CLAUDE.md § "Fidelity is the job"), so that arm is the floor.

## Acceptance criteria

- [ ] Each export this PR deletes or unexports also loses its row in
      `packages/ruby-compat/README.md`'s export table.
- [ ] For each arm (`?` predicate, `RELOPS`, each operator, `writerSpelling`,
      and each core-receiver method table: `STRING_METHOD_TABLE`,
      `TEMPORAL_METHOD_TABLE`, `ARRAY_METHOD_TABLE`, `ENUMERABLE_METHOD_TABLE`,
      `CLASS_METHOD_TABLE`, `OBJECT_METHOD_TABLE`), the PR body lists the
      computed-name call sites that reach it, found by instrumenting the arm
      under the package test files of those callers.
- [ ] Every arm no caller reaches is deleted, along with its twin in
      `basicObjRespondTo` / `checkDefinitionVisibility`, so `respond_to?` and
      `send` keep answering alike.
- [ ] Each surviving arm carries its callers in the PR body as the recorded
      floor, and no arm is added.
- [ ] 0194's `writer-spelling-camelize-memo` is closed `FALSIFIED:` if its arm
      was deleted, or left as is if the arm is the floor.
- [ ] `pnpm parity:api:sends`, `parity:api:calls` and `parity:api:calls:args`
      are green.
