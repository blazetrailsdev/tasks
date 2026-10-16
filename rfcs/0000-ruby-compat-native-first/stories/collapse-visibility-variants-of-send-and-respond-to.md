---
title: "Collapse the visibility variants of send / respond_to? onto rbFSend / rbObjRespondTo and remove dead include_private arms"
status: draft
updated: 2026-10-16
rfc: "0000-ruby-compat-native-first"
cluster: dispatch-cost
packages: []
deps:
  [
    converge-four-divergent-public-send-ports,
    compare-drops-include-private-only-arms,
    compare-visibility-reflection-calls-are-permanent-skips,
    call-args-drops-visibility-boolean-argument,
  ]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

CLAUDE.md "Method visibility is compile-time only" ratifies that trails has
no runtime privates. The ruby-compat surface still carries the visibility
variants:

- `rbFPublicSend` (`packages/ruby-compat/src/object.ts:861`) has the same body as `rbFSend` (`:948`), `sendInternal(args.length, [mid, ...args], recv)`. It has 62 calls in 33 files.
- `rbObjPrivateMethods` / `rbObjProtectedMethods` (`method.ts:195`, `:205`) always answer `[]`, and `rbObjPublicMethods` (`:184`) answers what `rbObjMethods` does. The only caller is `trailties/src/thor/command.ts`.
- `rbModPublicMethodDefined` (`object.ts:846`) answers "defined". It has 3 callers.
- The `priv` flag of `rbObjRespondTo` (`object.ts:1140`) and the `pub` flag of `basicObjRespondTo` (`:599`) are only forwarded to a class's own `isRespondTo` / `respondToMissing`. Eight overrides take an include-private parameter. Rails bodies that branch on it (`!include_private && super(name, true)`, `activemodel/lib/active_model/attribute_methods.rb:528-533`) have a second arm that cannot answer differently from the first.

The repo owner ruled (2026-10-16) that the dead arms are removed with a receipt rather than kept as Rails-shaped dead code.

## Acceptance criteria

- [ ] `rbFPublicSend` is deleted. Each call becomes `rbFSend`, or the native form where `native-respond-to-and-send-literal-name-sites` would switch it anyway.
- [ ] `rbObjPrivateMethods`, `rbObjProtectedMethods`, `rbObjPublicMethods` and `rbModPublicMethodDefined` are deleted. `rbObjMethods` survives. `trailties/src/thor/command.ts` keeps Rails' call structure over one `rbObjMethods` call, and the Thor command tests pass. This story is the sole owner of `command.ts` in this RFC.
- [ ] `rbObjRespondTo(obj, mid)` and `basicObjRespondTo(obj, mid)` drop the visibility parameter.
- [ ] A Rails override keeps its Rails parameter list (`isRespondTo(name, includePrivate = false)`, `respondToMissing(name, includePrivate)`) so `parity:api:params` stays green. The parameter is not read.
- [ ] Every arm whose only difference is `include_private` is removed. `compare-drops-include-private-only-arms` makes the gates accept the removal. A site that detector cannot prove carries `@missingRailsCall <call> — PERMANENT` against CLAUDE.md § "Method visibility is compile-time only".
- [ ] CLAUDE.md § "Method visibility is compile-time only" is amended: the `rbFPublicSend` and `rbModPublicMethodDefined` bullets and the "two super calls are still ported as two calls" sentence now describe the removal path.
- [ ] `pnpm parity:api:calls`, `parity:api:calls:args`, `parity:api:params` and `parity:api:extra:gate` are green. The ruby-compat extra mark is tightened.

## Notes

`converge-four-divergent-public-send-ports` (RFC 0189) lands first (a `deps`
edge) and converges its four ports onto `rbFPublicSend`. This story then
rewrites those call sites to `rbFSend` along with the other 62 calls. This
story also owns the CLAUDE.md § "Method visibility is compile-time only"
edit, and `native-first-policy-docs` does not touch that section.
