---
title: "structurally_compatible? carries a same-model guard Rails does not have"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already converged: structurallyCompatible now lives in relation/query-methods.ts:1573 as the one-line structurallyIncompatibleValuesFor(other).length === 0 body; the this._model !== other._model guard is gone."
---

# `structurally_compatible?` carries a model check Rails does not have

## Context

Surfaced converging the `structurally_compatible? ->
structurally_incompatible_values_for` call row in PR #6563. The row is
converged; this guard is left over and was NOT introduced by that PR.

Rails `QueryMethods#structurally_compatible?`,
`activerecord/lib/active_record/relation/query_methods.rb:1121-1123`:

    def structurally_compatible?(other)
      structurally_incompatible_values_for(other).empty?
    end

One line, no receiver-model comparison.
`structurally_incompatible_values_for` (query_methods.rb:2266-2277) compares
only the STRUCTURAL_VALUE_METHODS values; it never looks at the model.

trails, `packages/activerecord/src/relation.ts`:

    structurallyCompatible(other: Relation<T>): boolean {
      if (this._model !== other._model) return false;
      return this.structurallyIncompatibleValuesFor(other).length === 0;
    }

The `this._model !== other._model` early return has no Rails counterpart.
Rails' own docs for `#and` say the relations "must be scoping the same
model", but the predicate does not enforce it — so trails returns `false`
where Rails returns `true` for two structurally identical relations on
different models.

## Converged shape

Delete the guard; the method is Rails' single line. If a caller depends on
the model check, that caller is where the check belongs — and it should be
traced to a Rails line before it is kept anywhere.

## Acceptance criteria

- [ ] `structurallyCompatible` is the one-line body from
      query_methods.rb:1121-1123.
- [ ] `relation/structural-compatibility.test.ts` and `relation/and.test.ts`
      stay green; if one of them pins the trails-only behaviour, check the
      Rails test first (`vendor/rails/activerecord/test/cases/relation/`)
      rather than keeping the guard to satisfy it.
- [ ] All three adapter lanes green.
