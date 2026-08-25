---
title: "extra-surface: nested-class methods counted on the TS side but skipped on the Ruby side (94 classes)"
status: closed
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by PR #5458: the Ruby-side skip and TS-side collection now agree. This story asked to decide which side to change; the decision was 'both sides count nested-class methods', documented at the code site in extra-surface.ts. Its 'parent allow-set must stay uninflated' guard was NOT met and is tracked by the superseding story. The stale Version/gte tags it names are deleted."
---

## Context

> Re-homed from RFC 0072 (api-compare parity burndown), which was pruned to
> ActiveRecord-scoped work. This story changes `scripts/api-compare/` tooling,
> not a package, so it belongs with the fidelity-verification tooling.

Found while landing `extra-surface-adapter-cross-file-recurring-names` (PR 5345).

`scripts/api-compare/extra-surface.ts` scores nested classes asymmetrically:

- `buildPackageReport` builds `primaryClassPerFile`, then skips any Ruby class
  whose FQN starts with `primary + "::"` — so a nested Ruby class contributes
  **no methods** to the file's allow-set.
- `collectTsFileNames` iterates every TS class with `c.file === file`, including
  the TS mirror of that nested class — so its methods **are** counted as surface.

Net effect: every method of a faithfully-ported nested class scores as novel
drift. Concrete case from PR 5345: `AbstractAdapter::Version`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:243`)
is a real Rails nested class, but `gte`/`lt`/`major`/`minor`/`patch` all read as
novel; `patch`/`lt`/`toString` only escaped by coincidentally matching an
unrelated Rails method elsewhere and scoring `moved`.

Measured blast radius: **94 nested Ruby classes repo-wide have a TS counterpart
being scored this way** — `StatementPool` (all three adapters),
`JoinDependency::Aliases`, `Preloader::LoaderQuery`, `StatementCache::Substitute`,
`SQLite3Integer`, `OID::Bit::Data`, `Result::IndexedRow`, `InsertAll::Builder`,
and more. Reproduce by walking `rails-api.json` classes grouped by `file`,
taking the shortest-FQN entry as primary, and intersecting the nested short
names against `ts-api.json` classes.

This is a DIFFERENT axis from `extra-surface-allow-nested-class-names` (0072,
ready), which admits the nested class's **name** only and explicitly warns that
admitting its methods "must not re-open that hole". Decide deliberately which
side to change: either the TS side should also skip nested-class methods
(symmetric with the Ruby skip), or both sides should count them and the parent's
allow-set must stay uninflated. Do not just add names to the allow-set.

## Acceptance criteria

- Ruby-side skip and TS-side collection agree on nested classes; document which
  rule was chosen and why at the code site.
- A nested class ported faithfully no longer contributes novel names; the
  parent file's allow-set is still not inflated by the nested class's methods
  (the guard the sibling story calls for).
- Tests in `scripts/api-compare/extra-surface.test.ts` cover both directions.
- Record the novel-count delta from `pnpm parity:api && pnpm parity:api:extra
--package activerecord`, and delete any allowlist entry the fix makes stale
  (`Version`, `gte` on `connection-adapters/abstract-adapter.ts`).
