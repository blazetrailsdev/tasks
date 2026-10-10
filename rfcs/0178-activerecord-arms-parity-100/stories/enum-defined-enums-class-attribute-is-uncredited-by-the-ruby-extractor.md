---
title: "parity: the Ruby extractor does not credit base.class_attribute in Enum.extended"
status: draft
updated: 2026-10-10
rfc: "0178-activerecord-arms-parity-100"
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

Left by the PR that ported `Enum#_enum` line for line (story `enum-private-enum-body-is-a-line-for-line-port`).

Rails declares `defined_enums` in `Enum.extended`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/enum.rb:166-168`):

    def self.extended(base) # :nodoc:
      base.class_attribute(:defined_enums, instance_writer: false, default: {})
    end

It is the only `base.class_attribute(...)` call with an explicit receiver in the vendored tree.
`scripts/api-compare/extract-ruby-api.rb` credits `class_attribute` only as a bare command or a
paren call with no receiver (`:1034`, `:1106`), so `defined_enums` is in no Ruby manifest and
`pnpm parity:api:extra --package activerecord --novel-only` files `base.ts`'s
`declare static definedEnums` as novel. The declaration carries
`@noRailsEquivalent CONVERGEABLE enum-defined-enums-class-attribute-is-uncredited-by-the-ruby-extractor`
so the pinned extra-surface gate stays green.

## Acceptance criteria

- [ ] The Ruby extractor credits a `class_attribute` sent to the `base` parameter of
      `self.extended` / `self.included` to the extending class's surface, with a script test.
- [ ] `definedEnums` in `packages/activerecord/src/base.ts` carries no `@noRailsEquivalent` receipt
      and `pnpm parity:api:extra:gate` is green.
