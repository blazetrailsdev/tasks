---
title: "collection-proxy-delete-destroy-nil-return-on-empty-or-abort"
status: claimed
updated: 2026-07-03
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-03T19:43:08Z"
assignee: "collection-proxy-delete-destroy-nil-return-on-empty-or-abort"
blocked-by: null
closed-reason: null
---

## Context

Both `CollectionProxy#delete` and `#destroy`
(`packages/activerecord/src/associations/collection-proxy.ts`) return an empty
`Base[]` (`[]`) when called with no records or when a `before_remove` callback
aborts. Rails returns **nil** in both cases:

- `delete_or_destroy` (`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:385-386`)
  opens with `return if records.empty?` → nil.
- `remove_records` (`collection_association.rb:399-402`) aborts via
  `catch(:abort) { ... } || return` → nil.
- `CollectionProxy#delete`/`#destroy`
  (`collection_proxy.rb:624-693`) return that association result verbatim.

`[]` vs `nil` is observable: Ruby callers doing `if collection.destroy(x)`
treat an abort as falsy, but a JS `[]` is truthy, so an aborted removal reads
as "success." The `[]` return was a deliberate #4496 choice for `delete`
(typed `Promise<Base[]>`); `destroy` inherited it in the parity PR (#4503) to
keep the two in lockstep. Surfaced in Codex review of PR #4503.

## Acceptance criteria

- [ ] `CollectionProxy#delete` and `#destroy` return a nil-equivalent
      (`undefined`) — NOT `[]` — when `records.empty?` or a `before_remove`
      callback aborts, matching `delete_or_destroy`/`remove_records`.
- [ ] Both methods stay in lockstep (change them together; keep the shared
      `_removeRecords` contract consistent).
- [ ] Return type widened to `Promise<Base[] | undefined>`; audit the few
      internal callers (`assoc.delete`/`assoc.destroy` result users) so the
      wider type doesn't regress.
- [ ] Add/port tests asserting the nil return on empty-args and on abort.
