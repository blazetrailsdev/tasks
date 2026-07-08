---
title: "Replay superclass-declared enum decorator into concrete subclass _defaultAttributes materialization"
status: ready
updated: 2026-07-08
rfc: "0050-enum-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Discovered during enum-before-alias-must-raise (PR #4787). trails does NOT
replay a superclass-declared enum's `decorate_attributes` block into a concrete
subclass's `_defaultAttributes` materialization. Repro: an abstract parent
declares `enum :typeless_genre` (no column); a concrete subclass with a table
lacking that column materializes on `create({})`. Instrumenting the enum
decorator shows the inherited `typeless_genre` decorator never fires during the
subclass's create — only the subclass's own reflected-column enums replay. Rails
replays superclass pending decorators into the subclass attribute set
(activemodel/lib/active_model/attribute_registration.rb:81-87), so the enum
block runs and raises `Undeclared attribute type for enum` on first use.

In trails the raise is currently covered for this inherited case only via
`type_for_attribute` (base.ts guard checks the subclass's own columns), not via
the `create`/materialization replay. The primary (non-inherited) enum-before-alias
create path DOES raise correctly; this gap is specific to an enum declared on a
superclass/abstract parent.

Relevant code:

- `packages/activemodel/src/attribute-registration.ts` — PendingDecorator /
  applyPendingAttributeModifications (now threads the materializing `host`).
- `packages/activerecord/src/attributes.ts` — AR `_defaultAttributes` column-seed
  - replay; check whether superclass PendingDecorators are collected for a
    concrete subclass's set.
- `packages/activerecord/src/enum.ts` — decorator uses `host` (materializing class).

## Acceptance criteria

- A concrete subclass whose superclass/abstract parent declares an enum with no
  backing column on the subclass raises `Undeclared attribute type for enum` on
  first use via the create/materialization path (not only typeForAttribute).
- A concrete subclass that DOES back the inherited enum (e.g. Lion < abstract Cat
  with lions.gender) stays green — no false raise, no TableNotSpecified.
- Regression test mirroring the abstract-parent repro.
