---
title: "Probe lowering, checker-backed call resolver and the resolution report CLI, carrying the kill criterion"
status: draft
updated: 2026-10-07
rfc: "0000-ruby-ts-codegen"
cluster: tooling
packages: ["scripts"]
deps: ["codegen-constants-and-skeleton", "codegen-hint-pipeline"]
deps-rfc: []
est-loc: 1500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Decision 2 of this RFC: receivers, method-versus-property and async-ness
are resolved through the TypeScript checker, never through name sets. This
story is that resolver, delivered as a CLI that reproduces the spikes'
measurement from the real pipeline, and it carries the RFC's kill criterion.

**Probe lowering first.** The checker can only type a receiver that exists
in TypeScript. The skeleton gives class and member types; a local, a block
parameter or a chained receiver has a type only once the expression that
produces it has been lowered. So this story lowers the expression subset
needed to place a receiver in the virtual file: literals, locals, member
access, calls with positional and keyword arguments, and blocks as arrows
(so the checker's contextual typing gives block parameters their types).
Statements, control flow and the semantic nodes stay with
`codegen-lowering-and-first-output`, which reuses the probe lowering.

**Call resolution**, per call, in order: IR intrinsic (so `then` on a
thenable never resolves to the promise `then`, which the first spike hit on
`attachments.then`); member lookup by checker with the conventions
candidates (`rubyMethodToTs`); `operatorSpelling(fqn, op)` from
`scripts/api-compare/operator-order-spelling.ts` for operator methods; the
core dispatch table (seeded here with the rows the pilot corpus needs;
`codegen-lowering-and-first-output` adds rows as lowering demands them);
then decline. Member kind (method, accessor, property) and the signature
come from `getResolvedSignature`, which also instantiates overloads and
generics the spike could not (`Blob.create!` came back as
`InstanceType<T>[]`).

**The trails Concern shape** must be built in from the start. activesupport
spells a Concern as `Module<{instance members}> & { ClassMethods: typeof
ClassMethods }` (`packages/activesupport/dist/callbacks.d.ts:226-241`,
`rescuable.d.ts:11-34`, 43 declaration files in all). Class-level lookups
on an included trails module go through the `ClassMethods` property;
instance-level lookups through the `Module<T>` type argument; a gem module
named `X::ClassMethods` is resolved against `X`'s class side and `X`'s
includers. On activejob this one rule moved the no-hint unresolved share from
45.7% to 43.3% and recovered every `set_callback`, `define_callbacks` and
`run_callbacks` site. The remaining `rescue_from` sites need the includer
walk to continue past the first step (module, to includer, to a sibling
include), which the spike script stopped short of.

A call whose receiver is `any`, `unknown`, an uninstantiated type
parameter or the error type is declined; there is no name fallback.

**Pre-agreed split line** if this story overruns 2,500: the resolution
report CLI and the checkpoint measurement go to a follow-up story filed
against this RFC; the resolver and probe lowering ship here with their unit
tests.

**Precondition (every story in this RFC):** btwhooks' `PR_MAX_LOC` is set
to 2500 for spawns on this RFC (README "The LOC ceiling is lifted", Rollout
item 0). A worker whose prompt still says 700 stops and reports; it does not
split this story.

## Acceptance criteria

- [ ] Probe lowering for the expression subset above, with a test that a
      local assigned from a typed call and a block parameter of a typed
      callback both get their types from the checker, not from the sidecar.
- [ ] `pnpm codegen:resolve <gem>` prints, per file and in total, the share
      of call sites in each bucket (trails member, ruby-compat, gem-internal,
      schema attribute, intrinsic, structural, unresolved by reason) and
      writes the rows as JSON. Two figures: validated sidecar entries only,
      and with flagged entries included (informational).
- [ ] The Concern shape is implemented including the continued includer walk;
      `rescue_from` in `activejob/lib/active_job/exceptions.rb` resolves to
      `Rescuable.ClassMethods.rescueFrom`.
- [ ] Overloads and generics come from `getResolvedSignature`; a test shows
      `Blob.create!` typed as the instance, not `InstanceType<T>[]`.
- [ ] A receiver typed `any`/`unknown` declines; a test proves no name
      fallback fires.
- [ ] Incremental checker cost per statement is measured and recorded in the
      PR body (the spike's cold program over twelve packages took about 11
      seconds; a language-service host is the fallback if per-statement
      queries are too slow).
- [ ] **Checkpoint.** With the committed activejob sidecar, validated entries
      only, at least 85% of `activejob/lib` call sites (external adapters
      excluded) resolve. Below that, the number goes into the RFC README's
      Verification section, this story is still `done`, and the owner runs
      `tasks rfc-status 0000-ruby-ts-codegen postponed` with the figure as
      the reason; the three later stories stay `draft`. The bar and its
      basis are in the README's "The kill criterion".

## Verification

`pnpm codegen:resolve activejob` and `pnpm vitest run scripts/codegen`. The
no-hint baseline to beat is 43.3% unresolved of 1,539 call sites.
