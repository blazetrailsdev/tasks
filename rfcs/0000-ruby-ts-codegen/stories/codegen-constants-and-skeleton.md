---
title: "Constant resolver, import planner and skeleton emitter over a virtual TypeScript program"
status: draft
updated: 2026-10-07
rfc: "0000-ruby-ts-codegen"
cluster: tooling
packages: ["scripts"]
deps: ["codegen-ir-and-prism-bridge"]
deps-rfc: []
est-loc: 900
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Two of the three pieces the retired generator lacked were an import map and
a type layer. This story is both halves of the static side: how a Ruby
constant becomes a TypeScript import, and how every gem class gets a
TypeScript type before any body is lowered.

**Constant resolution and import planning.** In-gem constants resolve by
lexical nesting and ancestors over the gem index from
`codegen-ir-and-prism-bridge`. trails constants resolve by three strategies
measured in the first spike (459 of 467 activestorage references classified
without ambiguity): a walk of the package's namespace object type
(`ActiveRecord.Base` on `packages/activerecord/dist/namespaces.d.ts`), the
`rubyFileToTs` file convention from `scripts/parity/conventions.ts`, and a
unique export name in the package. Ruby core constants go to ruby-compat by
export name. Anything ambiguous or missing is recorded as unresolved so its
uses decline later. The output is a per-file import plan: direct imports for
heritage and module-level reads, namespace-object reads where the namespace
carries the constant.

**Skeleton emission.** Every gem file becomes a TypeScript declaration in a
virtual file system behind a `ts.Program` (or a language-service host, which
the next story measures): the class with its `extends`, mixin host
interfaces for modules, every member with its parameter names, attribute
declarations from the schema reader, and types from the sidecar where one
exists, else `unknown`. The skeleton must itself typecheck as a declaration
tree, which is the test that the import plan and the heritage are right.

The compiler API is `typescript-5`, never bare `typescript`, per the
scripts rule; the declarations it reads are the TS 7.1 build's `dist/**/*.d.ts`
(run `pnpm build` first; a stale build gives wrong answers).

**Precondition (every story in this RFC):** btwhooks' `PR_MAX_LOC` is set
to 2500 for spawns on this RFC (README "The LOC ceiling is lifted", Rollout
item 0). A worker whose prompt still says 700 stops and reports; it does not
split this story.

## Acceptance criteria

- [ ] The three trails constant strategies and the in-gem lexical walk are
      implemented; a test over activestorage reproduces or betters 459 of
      467 references classified.
- [ ] A per-file import plan is produced and a test asserts activejob's
      `base.rb` plan names every included module's file.
- [ ] The skeleton emitter writes every activejob file into the virtual FS
      and the whole tree typechecks as declarations, asserted by a test.
- [ ] Sidecar types, when present, appear on skeleton members; absent ones
      are `unknown`, never `any`.
- [ ] `pnpm codegen:skeleton <gem> --out <dir>` writes the skeleton to disk
      for inspection.

## Verification

`pnpm codegen:skeleton activejob --out /tmp/aj-skel && pnpm exec tsc -p
/tmp/aj-skel` is green, and `pnpm vitest run scripts/codegen`.
