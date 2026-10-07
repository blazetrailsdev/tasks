---
title: "Constant resolver, skeleton emitter and checker-backed call resolver, with a resolution report CLI"
status: draft
updated: 2026-10-07
rfc: "0000-ruby-ts-codegen"
cluster: tooling
packages: []
deps: [codegen-ir-and-prism-bridge]
deps-rfc: []
est-loc: 2200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Decision 2 of this RFC: the generator resolves receivers, method-versus-
property and async-ness through the TypeScript checker over the built
`.d.ts` of the ported packages, not through name sets. This story is that
resolver, delivered as a CLI that reproduces the four spikes' measurement
from the real pipeline.

Three pieces, in dependency order:

1. **Constant resolution and import planning.** In-gem constants by lexical
   nesting and ancestors. trails constants by three strategies measured in
   the first spike (459 of 467 activestorage references classified): a walk
   of the package's namespace object type (`ActiveRecord.Base` on
   `packages/activerecord/dist/namespaces.d.ts`), the `rubyFileToTs` file
   convention from `scripts/parity/conventions.ts`, and a unique export name
   in the package. Ruby core constants go to ruby-compat by export name.
   Anything ambiguous declines its uses. Output is a per-file import plan.
2. **Skeleton emission.** Every gem file as a TypeScript declaration into a
   virtual FS behind a `ts.Program` (or language-service host): heritage,
   mixin host interfaces, members with parameter names, attribute
   declarations from the schema reader, types from the sidecar else
   `unknown`. This is what gives a gem class a type before its file exists.
3. **Call resolution.** Per call, in order: IR intrinsic (so `then` on a
   thenable never resolves to the promise `then`, which the first spike hit
   on `attachments.then`), member lookup by checker with the conventions
   candidates (`rubyMethodToTs`), `operatorSpelling(fqn, op)` from
   `scripts/api-compare/operator-order-spelling.ts` for operator methods,
   the core dispatch table (seeded here with the rows the pilot corpus
   needs; story 4 adds rows as lowering demands them), then decline. Member kind
   (method, accessor, property) and the signature come from
   `getResolvedSignature`, which also instantiates overloads and generics the
   spike could not (`Blob.create!` came back as `InstanceType<T>[]`).

The trails Concern shape must be built in from the start. activesupport
spells a Concern as `Module<{instance members}> & { ClassMethods: typeof
ClassMethods }` (`packages/activesupport/dist/callbacks.d.ts:226-241`,
`rescuable.d.ts:11-34`, 43 declaration files in all). Class-level lookups on
an included trails module go through the `ClassMethods` property; instance-
level lookups go through the `Module<T>` type argument; a gem module named
`X::ClassMethods` is resolved against `X`'s class side and `X`'s includers.
On activejob this one rule moved the no-hint unresolved share from 45.7% to
43.3% and recovered every `set_callback`, `define_callbacks` and
`run_callbacks` site. The remaining `rescue_from` sites need the includer
walk to continue past the first step (module, to includer, to a sibling
include), which the spike script stopped short of.

A call whose receiver is `any`, `unknown`, an uninstantiated type parameter
or the error type is declined; there is no name fallback.

## Acceptance criteria

- [ ] `pnpm codegen:resolve <gem>` prints, per file and in total, the share
      of call sites in each bucket (trails member, ruby-compat, gem-internal,
      schema attribute, intrinsic, structural, unresolved by reason) and
      writes the rows as JSON.
- [ ] The three constant strategies are implemented and the activestorage
      figure (459 of 467 classified) is reproduced or bettered.
- [ ] The Concern shape is implemented including the continued includer walk;
      `rescue_from` in `activejob/lib/active_job/exceptions.rb` resolves to
      `Rescuable.ClassMethods.rescueFrom`.
- [ ] Overloads and generics come from `getResolvedSignature`; a test shows
      `Blob.create!` typed as the instance, not `InstanceType<T>[]`.
- [ ] A receiver typed `any`/`unknown` declines; a test proves no name
      fallback fires.
- [ ] **Checkpoint.** With the story 3 sidecar, at least 85% of
      `activejob/lib` call sites resolve. Below that, this story records the
      number in the RFC's Verification section and the RFC stops; the
      remaining stories are not started.
- [ ] Incremental checker cost per statement is measured and recorded (the
      spike's cold program over twelve packages took about 11 seconds).

## Verification

`pnpm codegen:resolve activejob` and `pnpm vitest run scripts/codegen`. The
no-hint baseline to beat is 43.3% unresolved of 1,539 call sites.
