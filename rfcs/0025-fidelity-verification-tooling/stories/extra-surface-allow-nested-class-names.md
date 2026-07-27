---
title: "extra-surface-allow-nested-class-names"
status: ready
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

> Re-homed from RFC 0072 (api-compare parity burndown), which was pruned to
> ActiveRecord-scoped work. This story changes `scripts/api-compare/` tooling,
> not a package, so it belongs with the fidelity-verification tooling.

Follow-up from `extra-surface-allow-ruby-file-constants` (PR that fed Ruby
`fileConstants` into the extra-surface allow-set). That pass closed constants
declared with `NAME = <rhs>`, but a Ruby **nested class/module** also declares a
constant in its file, and the allow-set still never sees those names.

Concrete leftover: `Version` reports as extra surface on
`connection-adapters.ts`, `connection-adapters/abstract-adapter.ts` and
`connection-adapters/abstract-mysql-adapter.ts`, yet
`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb`
declares `class Version` nested in `AbstractAdapter` (it shows up in
`scripts/api-compare/output/rails-api.json` as
`packages.activerecord.classes["ActiveRecord::ConnectionAdapters::AbstractAdapter::Version"]`
with `file: "connection_adapters/abstract_adapter.rb"`). It is neither a method
nor a `fileConstants` entry, so `collectAllowedNames`
(`scripts/api-compare/extra-surface.ts`) never admits it and it scores as drift.

The same rule shape applies as for constants: short name of a nested
class/module whose `file` matches → allowed; declared in a different `.rb` →
`moved` via `buildGlobalRubyCandidates`.

Note the interaction with the existing nested-class filter in
`buildPackageReport`: nested classes sharing a file with a shorter-named parent
are deliberately skipped as _method_ contributors (their methods must not
inflate the parent's allow-set). Admitting their **name** only is a different
axis and must not re-open that hole.

## Acceptance criteria

- Short names of Ruby classes/modules declared in the matched Ruby file join
  the allow-set (names only — not their methods).
- The global novel/moved oracle learns class/module short names, so a nested
  class declared in a different `.rb` scores `moved`, not `novel`.
- Tests in `scripts/api-compare/extra-surface.test.ts`: nested class in the
  matched file (allowed), nested class in another file (moved), TS-only class
  name (novel), plus a guard that the nested class's _methods_ still count as
  extra surface.
- Record the novel-count delta from `pnpm api:compare && pnpm api:extra
--package activerecord` (baseline after the constants PR: activerecord 736
  novel / 2090 moved / 2826 total).

## Fidelity-first policy

Moving toward Rails fidelity is the stated goal of this (and every)
extra-surface story; the allow-set/allowlist is a **last resort**. Before
admitting or keeping any name in the allow-set, first make — or file as its own
story — the fidelity change that would make the entry unnecessary: converge the
TS surface onto the Rails name and Rails-layout file (relocate + rename),
delete the invention, or justify an `@internal` at the declaration site. Only
names that are faithful-but-unmappable (e.g. genuine Ruby file constants or
nested class names present in the matched Rails file) belong in the allow-set;
any other allowlisted entry must cite the filed fidelity story next to it.
