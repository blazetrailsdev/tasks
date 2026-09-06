---
title: "sqlite3-execute-substitutes-empty-array-for-rails-nil"
status: in-progress
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 7552
claim: "2026-09-06T12:58:18Z"
assignee: "respond-to-is-only-defined-on-attribute-methods-hosts"
blocked-by: null
closed-reason: null
---

# SQLite3 execute returns [] where Rails' `super&.to_a` returns nil

## Context

Surfaced in review on PR #7280, which moved this body from the adapter class
into the Rails-matched file.

Rails' sqlite3 `execute` is a bare forward that preserves nil:

```ruby
# activerecord/lib/active_record/connection_adapters/sqlite3/database_statements.rb:53-57
def execute(...) # :nodoc:
  # SQLite3Adapter was refactored to use ActiveRecord::Result internally
  # but for backward compatibility we have to keep returning arrays of hashes here
  super&.to_a
end
```

`&.` means a nil from `super` comes back as nil, not `[]`. trails
(`packages/activerecord/src/connection-adapters/sqlite3/database-statements.ts:69-81`)
ends in

```ts
return result?.toArray() ?? [];
```

so the nil arm is substituted away. The `?? []` predates #7280 — it moved
verbatim from the adapter-class copy — and its return type
(`Promise<Record<string, unknown>[]>`) has hardened around it: every SQLite
`execute` call site is typed as receiving an array.

Believed unreachable today (`internalExecute`'s `rawExecute` chain does not
appear to resolve to null/undefined for this adapter), which is why it was not
blocking. It is still a converted Ruby idiom of exactly the class RFC 0082
enumerates — `&.` ported as `??`, which differs whenever the receiver is
legitimately nil — and the type is what makes it hard to unpick later.

## Converged shape

```ts
export async function execute(
  this: object,
  sql: string,
  name?: string | null,
  options?: { allowRetry?: boolean },
): Promise<Record<string, unknown>[] | undefined> {
  const result = (await abstractExecute.call(
    this as DatabaseStatementsHost,
    sql,
    name,
    options,
  )) as { toArray(): Record<string, unknown>[] } | null | undefined;
  return result?.toArray();
}
```

i.e. drop the `?? []` and widen the return, then fix the call sites the widening
reveals. Check whether the abstract `execute`
(`abstract/database-statements.ts:314-321`) can actually resolve nullish for
this adapter before deciding how much call-site churn is warranted — if it
provably cannot, the honest close may be to keep the array type and record why,
but that is a finding to establish, not to assume.

## Acceptance criteria

- [ ] `execute` no longer substitutes `[]` for a nullish result, or the story is
      closed with evidence that the abstract chain cannot produce one.
- [ ] Call sites the widened type breaks are fixed rather than cast away.
