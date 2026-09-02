---
title: "Delete the no-explicit-any relaxation the Module mixin primitives carried into ruby-compat"
status: ready
updated: 2026-09-02
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: 80
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7361 moved `include.ts` / `prepend.ts` from `packages/activesupport/src/`
to `packages/ruby-compat/src/`. activesupport turns
`@typescript-eslint/no-explicit-any` off package-wide
(`eslint.config.mjs`, the `── activesupport ──` block); ruby-compat does not, so
the move surfaced 19 `any`s in the sources and 26 more in `include.test.ts`.

Rather than rewrite a 600-line mechanism's types inside a pure move, the
relaxation travelled with the files: a new `eslint.config.mjs` block scoped to
`packages/ruby-compat/src/{include,prepend}{,.test}.ts` — four files, not the
package. That block is debt, not a decision, and this story deletes it.

The `any`s are concentrated in three shapes at
`packages/ruby-compat/src/include.ts`:

- `type AnyClass = new (...args: any[]) => any` (line ~25)
- `type ModuleObject = Record<string, any>` (line ~26)
- `CallableMethods<M>`'s `M[K] extends (this: any, ...args: any[]) => any`
  filter (line ~367)

The deleted-by-sweep rationale (recoverable from the pre-move blob,
`git show 593126a62:packages/activesupport/src/include.ts`) recorded that
`unknown[]` breaks the constructor and `this`-parameter variance the mixin
shapes are built on, and that constraining `M` to the runtime `ModuleObject`
forces a string index signature into every merging class — which is why arel's
`Attribute` (with `relation`, `name`, `caster`) cannot mix a `Record`-shaped
result. Any replacement has to keep both properties.

## Acceptance criteria

- [ ] The `── ruby-compat: the Module mixin primitives ──` block in
      `eslint.config.mjs` is DELETED, not narrowed.
- [ ] `npx eslint packages/ruby-compat` is clean with the rule at its default
      `error`.
- [ ] `pnpm typecheck`, `pnpm test:types` and `pnpm test:types:virtualized`
      stay green — the DX type tests are what would catch a widened index
      signature reaching `Attribute`.
- [ ] `include` / `prepend` / `concern` / `proxy-wrappers` / `current-attributes`
      tests pass.
- [ ] If a genuine TypeScript shortcoming survives the attempt, `tasks block`
      with the specific construct rather than re-adding the block.
