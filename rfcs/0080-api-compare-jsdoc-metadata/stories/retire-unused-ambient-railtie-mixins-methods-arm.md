---
title: "AMBIENT_RAILTIE_MIXINS.methods has no users left — delete it or justify keeping it"
status: in-progress
updated: 2026-07-28
rfc: "0080-api-compare-jsdoc-metadata"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 5470
claim: "2026-07-28T00:28:15Z"
assignee: "retire-unused-ambient-railtie-mixins-methods-arm"
blocked-by: null
closed-reason: null
---

## Context

`AMBIENT_RAILTIE_MIXINS` (`scripts/api-compare/extra-surface.ts:88-114`) has two
arms. `includes` is used: `ActiveRecord::Base` gains `GlobalID::Identification`
through globalid's railtie (`vendor/globalid/lib/global_id/railtie.rb:35`), which
the static Ruby extractor cannot see. `methods` now has **zero entries** — #5368
removed its only user (the model-side `find_global_id` /
`find_signed_global_id[!]` names, which were never Rails methods at all and are
now deliberately left visible as extra surface).

The field, its type, and its consumer loop (`for (const name of ambient.methods
?? []) addRubyName(name)` at roughly extra-surface.ts:648) all remain. Keeping
unused configuration machinery is the kind of thing CLAUDE.md's "no empty stubs"
rule exists to prevent, but there is a real argument for keeping it: the blind
spot it covers is a property of the Ruby extractor rather than of any one gem, so
the next railtie-injected `def`-less method would need it back.

Note that `PORTED_UNPORTED_MIXIN_METHODS` (same file, just below) applies raw
Ruby names through the identical `addRubyName` path and IS in use, so the
mechanism survives even if this field goes.

## Acceptance criteria

- Decide: delete the `methods` arm (field, type member, and consumer loop) or
  keep it with the justification recorded at the declaration. Deleting is the
  default given no users and a live sibling mechanism.
- If deleted, `pnpm api:compare && pnpm api:extra` stays green with unchanged
  per-package totals, and the `AMBIENT_RAILTIE_MIXINS` doc comment loses the
  paragraphs describing `methods`.
- No change to the `includes` arm, which is load-bearing.
