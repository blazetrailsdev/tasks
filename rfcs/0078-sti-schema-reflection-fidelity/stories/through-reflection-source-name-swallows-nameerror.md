---
title: "ThroughReflection#source_reflection_name swallows NameError where Rails lets it propagate"
status: done
updated: 2026-08-18
rfc: "0078-sti-schema-reflection-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6723
claim: "2026-08-18T20:36:49Z"
assignee: "wave-4c-ar-core-residue-config"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging the reflection memos onto Rails' `||=` in #6711
(`reflection-registry-discard-on-rebind-vs-generation-gate`).

`ThroughReflection#sourceReflectionName`
(`packages/activerecord/src/reflection.ts`) wraps its candidate scan in a
`try/catch` that swallows **every** error and memoizes `null`:

```ts
} catch (e: unknown) {
  if (e instanceof AmbiguousSourceReflectionForThroughAssociation) throw e;
  this._sourceReflectionNameCache = null;
}
```

The error it actually swallows is
`NameError: Missing model class Tagging for the ... association`, raised out of
`throughRef.klass` while the target is not yet in `modelRegistry` — this is the
exact mechanism `reflection-registry-poison-actual-mechanism` (#6702)
instrumented and confirmed.

Rails has **no rescue at all** here:

`activerecord/lib/active_record/reflection.rb:1112-1130`

```ruby
def source_reflection_name # :nodoc:
  @source_reflection_name ||= begin
    names = [name.to_s.singularize, name].collect(&:to_sym).uniq
    names = names.find_all { |n|
      through_reflection.klass._reflect_on_association(n)
    }
    if names.length > 1
      raise AmbiguousSourceReflectionForThroughAssociation.new(...)
    end
    names.first
  end
end
```

A `NameError` from `through_reflection.klass` propagates to the caller in Ruby.
trails converts it into a silent `null`, which then surfaces much later and much
further away as `HasManyThroughSourceAssociationNotFoundError` from
`checkValidityBang` — an error naming the wrong cause.

The same shape appears twice more in the same class: the `try/catch` in the
`source` getter (`/* klass resolution may fail */`) and the one in
`sourceReflection`.

PR #6711 made this survivable rather than permanent — the `||=` no longer memoizes
the `null`, so the next read retries once the model registers — but the swallow
itself is still a divergence, and it is what makes a genuinely missing model
report as a missing _source association_.

## Converged shape

- Drop the blanket catch in `sourceReflectionName`; let `NameError` propagate as
  it does in Ruby. The `AmbiguousSourceReflectionForThroughAssociation` rethrow
  is the only branch Rails has, and it is already there.
- Same for the `source` getter and `sourceReflection`, or justify each remaining
  catch at the call site with the Rails line it stands in for.
- Verify the two-file repro stays green:
  `pnpm vitest run --no-file-parallelism
packages/activerecord/src/associations/nested-through-associations.test.ts
packages/activerecord/src/associations.test.ts`
  If removing the catch reds it, the real blocker is eager resolution against an
  incomplete registry, and that is worth capturing rather than re-hiding.

## Acceptance criteria

- [ ] `sourceReflectionName` has no catch beyond Rails' ambiguity rethrow.
- [ ] A missing model class reports as `NameError` naming the model, not as
      `HasManyThroughSourceAssociationNotFoundError`.
- [ ] A regression test covers that error identity; it must fail on baseline.
- [ ] `parity:api:calls` / `:args` clean; `parity:api` / `parity:test` deltas
      non-negative.
