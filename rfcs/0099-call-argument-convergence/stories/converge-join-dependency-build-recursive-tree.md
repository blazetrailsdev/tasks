---
title: "Converge JoinDependency#build onto Rails' recursive JoinAssociation tree"
status: done
updated: 2026-08-15
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: 6578
claim: "2026-08-15T21:15:04Z"
assignee: "converge-relation-has-limit-or-offset-call-sites"
blocked-by: null
closed-reason: null
---

# Converge `JoinDependency#build` onto Rails' recursive JoinAssociation tree

## Context

Surfaced converging RFC 0099's `kind: "args"` rows in PR #6557. The row

    activerecord | associations/join-dependency.ts | build | build
    rubyArgs: [right, klass]

could not be converged and carries a reviewed reason in
`scripts/api-compare/call-mismatches-exclude/activerecord/associations/join-dependency.json`.

`vendor/rails/activerecord/lib/active_record/associations/join_dependency.rb:228-240`:

    def build(associations, base_klass)
      associations.map do |name, right|
        reflection = find_reflection base_klass, name
        reflection.check_validity!
        reflection.check_eager_loadable!
        if reflection.polymorphic?
          raise EagerLoadPolymorphicError.new(reflection)
        end
        JoinAssociation.new(reflection, build(right, reflection.klass))
      end
    end

Rails recurses over the nested associations hash and RETURNS a tree of
`JoinAssociation` nodes, each holding its children. trails
(`packages/activerecord/src/associations/join-dependency.ts:384-398`) instead
mutates a flat node list keyed by association PATH, for shared-prefix dedup,
so the recursion also threads an alias and a parent path:

    this.build(child, node.baseKlass, node.effectiveSqlName, childPath)

That is a state-model divergence, not an argument-list one — the argument row is
only where it surfaced. RFC 0027 chartered this convergence and is now closed
with the state model still divergent.

## Converged shape

`build(associations, baseKlass)` returns `JoinAssociation[]`, each node owning
its children, with the dedup expressed the way Rails expresses it rather than by
a path-keyed side table.

## Acceptance criteria

- [ ] `build` mirrors join_dependency.rb:228-240 — same two parameters, same
      branch order, same `check_validity!` / `check_eager_loadable!` /
      `polymorphic?` guards, returning the node array.
- [ ] The `build -> build` row is deleted by hand from its shard (no `--write`,
      no reseed).
- [ ] `pnpm parity:api:calls:args` green; SQLite, PostgreSQL and MySQL/MariaDB
      lanes green.
