---
title: "bodyless-owner-fix-misses-extended-included-hosts"
status: ready
updated: 2026-09-02
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0126's `export-host-types-kept-local-for-bodyless-owner-bug` exported the
host types PR #6798 had kept local — `AttributeMethodsHost` /
`InstanceMethodHost` in `packages/activerecord/src/attribute-methods.ts` and
`ReadWriteHost` in `packages/activemodel/src/attribute-methods.ts`. Those three
are green: PR #7154's `MethodInfo.bodyless` / `ownersWithBodies` fix in
`scripts/api-compare/compare.ts` keeps the real bodies winning the call-parity
pairing.

Two did NOT survive:

interface ClassMethodsHost extends AttributeMethodHost, Extended<typeof ClassMethods> {}
interface InstanceMethodsHost extends InstanceHost, Included<typeof InstanceMethods> { … }

(`packages/activemodel/src/attribute-methods.ts:124` and `:133`). Exporting
either turns `pnpm parity:api:calls` red with three STALE rows —
`attribute_method?  include?`, `define_call  match?`,
`resolve_attribute_name  fetch` — i.e. the bodyless owner outranks the real body
again. #7154 fixed the plain-interface case; a host whose members arrive through
`Extended<>` / `Included<>` still slips past it, so those two stayed local.

## Acceptance criteria

- [ ] `ownersWithBodies` (or its caller) treats a member reaching an exported
      interface through `Extended<>` / `Included<>` as bodyless, the way it
      already treats a directly-declared interface member.
- [ ] `ClassMethodsHost` and `InstanceMethodsHost` are exported, per the trails
      mixin idiom CLAUDE.md documents.
- [ ] `pnpm parity:api:calls` green with NO row going stale.
