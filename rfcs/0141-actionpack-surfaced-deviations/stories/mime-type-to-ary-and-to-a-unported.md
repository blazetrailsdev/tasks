---
title: "mime-type-to-ary-and-to-a-unported"
status: draft
updated: 2026-10-10
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`to_ary` left the global `SKIP_GROUPS[0]` list in `scripts/parity/conventions.ts` (story
`activerecord-score-core-object-protocol-names`), so `parity:api` now reports `Mime::Type#to_ary`
as missing beside the already-missing `Mime::Type#to_a`:

```ruby
private
  def to_ary; end
  def to_a; end
```

(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/mime_type.rb:332-334`). Both answer `nil`
so `Array(mime)` and `Array#flatten` never reach `method_missing` (:336-342), which would raise
`NoMethodError` for them. trails: `packages/actionpack/src/action-dispatch/http/mime-type.ts`
defines neither (`methodMissing` is at :264). `ActionDispatch::Response::Buffer#to_ary`, the other
actionpack definition the un-skip surfaced, is story `response-buffer-to-ary-unported`.

## Acceptance criteria

- [ ] `Mime::Type#toAry` and `#toA` are ported as private members answering `null`, in Rails' order before `methodMissing`.
- [ ] `pnpm parity:api` reports no missing `to_ary` / `to_a` for `http/mime_type.rb`.
