---
title: "Hoist catch(:abort) out of the shared callback dispatcher back to Rails' call sites"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: 6432
claim: "2026-08-12T19:16:52Z"
assignee: "converge-collection-callback-abort-catch-to-call-sites"
blocked-by: null
closed-reason: null
---

## Context

Rails wraps only the _before_ callbacks in `catch(:abort)`, at the call site,
inside the method that fires them:

```ruby
# collection_association.rb:462-465 (replace_on_target)
catch(:abort) do
  callback(:before_add, record)
end || return unless skip_callbacks
```

```ruby
# collection_association.rb:400-402 (remove_records)
catch(:abort) do
  callback(:before_remove, record)
end || return false unless skip_callbacks
```

trails hoists the catch INTO the shared dispatcher instead, which inspects the
callback kind to decide whether to catch:

```ts
// collection-association.ts — CollectionAssociation#callback
const catchAbort = kind.startsWith("before");
```

so the `catch` never appears at either call site. The call-set ratchet sees
this as a dropped call and it is baselined twice under
`scripts/api-compare/call-mismatches-exclude/activerecord/associations/collection-association.json`:

- `remove_records` → `catch` (seeded when the wide ratchet landed)
- `replace_on_target` → `catch` (added by PR #6426, which collapsed the
  duplicated `replace_on_target` bodies onto one method and so surfaced the
  same pre-existing split a second time)

The `kind.startsWith("before")` sniff is the tell: Rails does not branch on the
callback kind anywhere, because the two call sites simply differ in whether
they wrap. Encoding that difference as a string-prefix test inside the
dispatcher is a trails invention, and it silently decides abort semantics for
any future callback kind by how its name happens to start.

## Converged shape

`callback` fires callbacks and nothing else. Each call site wraps as Rails does
— `replace_on_target` (`:462-465`) and `remove_records` (`:400-402`) catch the
abort around the _before_ call and take Rails' early return; the after-callback
sites (`:408`, `:485`) do not. `catchAbort` / the `startsWith("before")` sniff
is deleted.

Both baseline rows converge by deletion. The baseline is only-shrink: delete
the two rows by hand, do not reseed.

## Acceptance criteria

- [ ] `catchAbort` and the `kind.startsWith("before")` branch are gone from
      `CollectionAssociation#callback`.
- [ ] `replaceOnTarget` and `removeRecords` each catch the abort sentinel at
      their own before-callback call site, with Rails' early return
      (`|| return` / `|| return false`).
- [ ] Both `catch` rows are deleted from
      `call-mismatches-exclude/activerecord/associations/collection-association.json`
      and `pnpm parity:api:calls` is green.
- [ ] `packages/activerecord/src/associations/` stays green, including the
      before_add / before_remove abort tests.
