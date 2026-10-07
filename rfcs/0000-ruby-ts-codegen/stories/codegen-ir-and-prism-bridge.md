---
title: "IR node set, Prism bridge and IR builder, with an IR dump CLI over activejob"
status: draft
updated: 2026-10-07
rfc: "0000-ruby-ts-codegen"
cluster: tooling
packages: []
deps: []
deps-rfc: []
est-loc: 1600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The retired generator (`scripts/prism-codegen`, deleted in trails PR 6168)
had no intermediate representation: Prism AST went to `ts.factory` nodes in
one pass, with name-keyed side tables for async names, port methods and
delegations. This RFC's Design section defines the IR that replaces that, and
this story builds it end to end: the Ruby side that dumps Prism to JSON, the
node types, and the builder that produces the IR for every file in the pilot
corpus.

The IR is one tree per file, immutable, every node carrying a stable id and
its Ruby `file:line`. Declarations and the ordinary expression set are listed
in the README's Design; the semantic nodes with exactly one reviewed lowering
are `Truthy`, `OrValue`/`AndValue`/`OrAssign`, `Fetch`, `Present`/`Blank`/
`Presence`, `KwArgs`/`KwParam`, `ImplicitReturn`, `Yield`/`BlockGiven`/
`BlockPass`/`SymProc`, `SafeNav`, `Tap`/`Then`, `BangCall`/`PredicateCall`,
`Sym` distinct from `Str`, `StrMutate`, `CaseEq`, `ClassIvar`,
`ObjectProtocol`, `Raise`/`Rescue`/`Ensure`.

The parse side is a Ruby subprocess over the `prism` gem bundled with Ruby
3.3 (1.9.0 on the dev host), as the spike's `extract.rb` did; `@ruby/prism`
does not return as a dependency. Prism already separates a local-variable
read from a receiverless call (`variable_call?`), so the builder does not
re-derive scoping. The builder records each block's `self` kind: instance for
callback macros, `rescue_from`, `retry_on`, `discard_on` and `validate`
blocks; class for `scope` lambdas, `included do` and `class_methods do`. In
the spike, getting these wrong (treating a `then` block or a `rescue_from`
block as class-level) was the single largest source of false "self-call not
found" rows on activejob.

Prior art to read first: the retired handlers at `311bff350c^`
(`scripts/prism-codegen/handlers/*.ts`) for the node kinds attempt two
covered and the ones it dropped (nested `ClassNode`/`ModuleNode` inside a
class body, 10,823 nodes across 62 files, was its largest hole).

## Acceptance criteria

- [ ] `scripts/codegen/ir/` defines the node set from the README's Design as
      TypeScript types with a discriminant, an id and a `loc`.
- [ ] `scripts/codegen/prism-dump.rb` emits Prism as JSON for a file list and
      is invoked through a subprocess from the TypeScript side.
- [ ] The builder handles every Prism node kind that occurs in
      `vendor/rails/v8.0.2/activejob/lib/**` and
      `vendor/rails/v8.0.2/activestorage/{app,lib}/**`; an unhandled kind is a
      test failure listing the kind and a `file:line`, not a silent
      passthrough.
- [ ] Tail positions are marked through `if`, `unless`, `case`, `begin` and
      `rescue` arms; `Truthy` is inserted at every condition position; the
      semantic nodes above are produced where their Ruby form occurs.
- [ ] `pnpm codegen:ir <file.rb>` prints the IR as JSON; golden tests cover
      one file per Ruby construct family (`blob.rb`, `arguments.rb`,
      `callbacks.rb`, `exceptions.rb`, `disk_service.rb`).
- [ ] Block `self` kinds follow the list in Context and are covered by a
      test over `activejob/lib/active_job/exceptions.rb` and
      `activestorage/app/models/active_storage/blob.rb`.

## Verification

`pnpm vitest run scripts/codegen` and `pnpm codegen:ir
vendor/rails/v8.0.2/activejob/lib/active_job/arguments.rb | head`.
