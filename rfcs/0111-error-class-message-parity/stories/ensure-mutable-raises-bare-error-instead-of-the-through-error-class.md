---
title: "ensure-mutable-raises-bare-error-instead-of-the-through-error-class"
status: ready
updated: 2026-09-06
rfc: "0111-error-class-message-parity"
cluster: bare-error-throws
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# `ensure_mutable` raises a bare `Error` instead of the Rails error class

## Context

`packages/activerecord/src/associations/through-association.ts`'s
`ensureMutable` throws a bare `Error` with a trails-invented message:

```ts
function ensureMutable(assoc: { owner: Base; reflection: any }): void {
  const sourceRefl = assoc.reflection.sourceReflection?.();
  if (sourceRefl && sourceRefl.macro !== "belongsTo") {
    throw new Error(
      `Cannot modify association '${assoc.reflection.name}': ` +
        `through associations with a non-belongs-to source are read-only.`,
    );
  }
}
```

Rails
(`activerecord/lib/active_record/associations/through_association.rb:95-103`):

```ruby
def ensure_mutable
  unless source_reflection.belongs_to?
    if reflection.has_one?
      raise HasOneThroughCantAssociateThroughHasOneOrManyReflection.new(owner, reflection)
    else
      raise HasManyThroughCantAssociateThroughHasOneOrManyReflection.new(owner, reflection)
    end
  end
end
```

PR #6684 did exactly this conversion for the sibling `ensure_not_nested`
(`through_association.rb:104-112`) in the same file, so the shape is settled:
branch on `reflection.has_one?`, raise the matching error class with
`(owner, reflection)`.

Note the guard also differs — Rails checks `source_reflection.belongs_to?`
unconditionally, while the port skips the check when the source reflection is
missing.

## Converged shape

- `ensureMutable` mirrors `through_association.rb:95-103` line for line: the
  `belongs_to?` guard, the `has_one?` branch, and the two error classes built
  from `(owner, reflection)`.
- Depends on the error classes taking `(owner, reflection)` — see
  `through-cant-associate-error-takes-owner-and-reflection`.

## Acceptance criteria

- [ ] No bare `Error` remains in `ensureMutable`; both Rails arms are ported.
- [ ] The guard matches Rails (no extra "source reflection missing" escape).
- [ ] Association / through suites green on SQLite, PostgreSQL and MySQL/MariaDB.

## Re-homed from `0023-surfaced-deviations` (2026-08-18)

Moved by the RFC 0023 backlog triage pass into `0111-error-class-message-parity`, which was carved out
of that register for this deviation class. Nothing about the finding changed —
every Rails and trails `file:line` citation above is as originally filed.
