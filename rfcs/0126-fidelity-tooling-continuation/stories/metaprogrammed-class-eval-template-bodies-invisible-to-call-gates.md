---
title: "metaprogrammed-class-eval-template-bodies-invisible-to-call-gates"
status: done
updated: 2026-09-02
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: 7395
claim: "2026-09-02T17:24:29Z"
assignee: "bodyless-owner-fix-misses-extended-included-hosts"
blocked-by: null
closed-reason: null
---

## Context

Split out of `metaprogrammed-method-bodies-invisible-to-call-gates`, which
delivered the `define_method`-block half: `record_metaprogrammed_method`
(`scripts/api-compare/extract-ruby-api.rb`) now takes the block body node and
runs it through `record_body_facts`, the same `collect_method_calls` /
`collect_call_args` / `collect_method_skeleton` / `body_digest` pipeline the
literal-`def` path uses, so a `define_method(name) { … }` entry is
indistinguishable from a `def`-written one in the manifest.

The `class_eval`-with-a-string-template half is still invisible. Those methods
carry no `calls`, `callArgs`, `skeleton` or `bodyDigest`, so the call-set gate
(`parity:api:calls`), the call-argument gate (`parity:api:calls:args`) and the
body-pin machinery cannot see their bodies, and a port that drops the body's
calls entirely is scored green.

Live population:

- `activerecord/lib/active_record/migration/command_recorder.rb:125-131`
  generates 43 methods whose body is `record(:"#{method}", args, &block)`.
- `activerecord/lib/active_record/association_relation.rb:18-28` generates 6
  whose body raises `ArgumentError` then calls `super`.
- `activerecord/lib/active_record/relation.rb`'s `VALUE_METHODS` loop.

## Converged shape

`codegen_template` (`extract-ruby-api.rb:2155`) already reconstructs the
interpolated heredoc per member with a sentinel for the member name. Re-parse
that reconstructed source per member with `Ripper.sexp`, find the generated
`def`'s body node, and hand it to `record_body_facts` — the same entry point
the `define_method` half now uses, so the two halves converge on one collector
rather than two.

Risks to design for:

- A template that does not parse standalone (a fragment, an unbalanced `end`)
  must be skipped, never guessed at — record the method with no body facts, as
  today.
- Line numbers inside the re-parsed template are meaningless; keep the
  `@current_line` of the `class_eval` call site.
- Re-parsing 43 templates per loop is a per-member Ripper parse; check it does
  not move `parity:api` wall time materially.

Expect new rows on `parity:api:calls` / `parity:api:calls:args` the moment
these bodies start carrying calls — those are pre-existing port divergences
becoming visible, not regressions. Hand-add baseline rows via
`serializeBaseline` (never `--write`).

## Acceptance criteria

- [ ] A `class_eval "def #{name}; record(:\"#{name}\", args, &block); end"`
      entry carries the template body's `calls` and `callArgs`, matching what
      the same body written as a literal `def` produces.
- [ ] `command_recorder.rb`'s 43 generated methods record `record`.
- [ ] A template that does not parse standalone records no body facts and
      raises nothing.
- [ ] A test in `scripts/api-compare/extract-ruby-api.test.ts` pins the
      template-reparse arm.
- [ ] `parity:api:calls` and `parity:api:calls:args` green, with any newly
      surfaced divergence either converged or baselined with a reviewed
      one-line reason.
- [ ] No package's `parity:api` method count falls.
