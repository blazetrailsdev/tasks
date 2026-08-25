---
title: "Converge Merger#merge_multi_values order/extensions arms, drop qualifyOrderForOther"
status: done
updated: 2026-08-16
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6612
claim: "2026-08-16T20:33:34Z"
assignee: "collection-proxy-delegate-query-method-value-readers-to-scope"
blocked-by: null
closed-reason: null
---

## Context

Rails' `Merger#merge_multi_values` is four lines and does two things — apply the
other relation's order (as a `reorder!` when the other side is reordering, else
an `order!`), and union in its extension modules:

```ruby
def merge_multi_values
  if other.reordering_value
    # override any order specified in the original relation
    relation.reorder!(*other.order_values)
  elsif other.order_values.any?
    # merge in order_values from relation
    relation.order!(*other.order_values)
  end

  extensions = other.extensions - relation.extensions
  relation.extending!(*extensions) if extensions.any?
end
```

(`vendor/rails/activerecord/lib/active_record/relation/merger.rb:154-167`)

Note `order!` is `self.order_values |= args` — a **union-append** onto the
receiver's existing order, not a replacement.

trails' `mergeMultiValues`
(`packages/activerecord/src/relation/merger.ts`) diverges on both counts:

```ts
private mergeMultiValues(rel: any): void {
  if (this.other.orderValues && this.other.orderValues.length > 0) {
    const sameKlass = this.other._model === rel._model;
    rel.orderValues = sameKlass
      ? [...this.other.orderValues]
      : this.other.orderValues.map((c: unknown) => this.qualifyOrderForOther(c));
  }
}
```

1. It **replaces** `order_values` outright rather than unioning, and never
   consults `reordering_value` — so the `reorder!` vs `order!` branch
   (merger.rb:155-161) has no counterpart at all.
2. It carries a trails-only helper, `qualifyOrderForOther`, that rewrites a
   cross-model bare-column order against the _other_ model's table. Rails needs
   no such helper because `order!` runs `preprocess_order_args` at `order!`
   time, so `order_values` already hold table-qualified Arel nodes by the time
   Merger sees them. The helper is compensating for trails deferring
   qualification to SQL build.
3. The `extensions` union (merger.rb:165-166) has no counterpart.

PR #6602 converged `Merger#merge` onto Rails' generic `NORMAL_VALUES` loop and
retired the hand-written `mergeUnscope` / `mergeExtending` / `mergeCtes` /
`mergeEagerLoad` methods plus the per-key arms of `mergeSingleValues`. It left
`mergeMultiValues`' order arm alone deliberately: flipping replace→union and
routing through `order!` changes merge semantics broadly, which is its own
change with its own blast radius, and the story asked only for the loop.

Surfaced in review of PR #6602 (`converge-merger-normal-values-loop`).

## Acceptance criteria

- `mergeMultiValues` is `merger.rb:154-167` line-for-line: the
  `reordering_value` / `order_values.any?` branch calling `reorder!` / `order!`,
  then the `extensions` difference calling `extending!`.
- Order merging is Rails' union-append via `order!` (`self.order_values |=
args`), not a replacement.
- `qualifyOrderForOther` is deleted. If a cross-model bare-column order still
  mis-binds afterwards, the fix belongs in `preprocess_order_args` at `order!`
  time — where Rails does it — not in Merger.
- `pnpm parity:api:calls` / `:args` clean; `parity:api:extra` shows no growth
  (this should REMOVE `qualifyOrderForOther`); `parity:api` / `parity:test`
  deltas non-negative.
- Green on SQLite, PostgreSQL and MySQL/MariaDB — the association and scoping
  suites exercise cross-model merges heavily.
