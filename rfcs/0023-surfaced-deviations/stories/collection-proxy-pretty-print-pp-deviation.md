---
title: "collection-proxy: pretty_print/PP.pp has no trails equivalent (test_pretty_print ports to inspect)"
status: done
updated: 2026-06-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 3654
claim: "2026-06-19T16:00:26Z"
assignee: "collection-proxy-pretty-print-pp-deviation"
blocked-by: null
---

## Context

`vendor/rails/activerecord/test/cases/associations_test.rb:561-568` (AssociationProxyTest#test_pretty_print):

```ruby
def test_pretty_print
  andreas = Author.find(1)
  assert_nothing_raised do
    out = StringIO.new
    PP.pp(andreas.audit_logs, out)
    # => #<ActiveRecord::Associations::CollectionProxy []>
  end
end
```

Rails uses Ruby's `PP.pp(obj, io)` which calls `obj.pretty_print(pp_instance)`. `CollectionProxy` (and `Relation`) define `pretty_print` to render `#<ClassName [records...]>`. There is no equivalent in trails — we don't expose a `pp` method or a `prettyPrint` protocol on CollectionProxy or Relation.

In the AssociationProxyTest canonical conversion (PR #3600), the test was ported as an `inspect()` call (the closest available analog), but that exercises a different code path than Rails' `PP.pp`.

Trails `associations.test.ts` line ~193: `it("test_pretty_print", ...)` currently calls `david.auditLogs.inspect()` — not the same as Rails' pretty-printer protocol.

## Acceptance criteria

- [ ] CollectionProxy (and Relation) expose a `prettyPrint` / `pp`-compatible interface, or the test is updated to call the correct equivalent once one exists.
- [ ] `test_pretty_print` in AssociationProxyTest exercises the same code path as Rails (pretty-printer protocol, not just `inspect`).
- [ ] Or: document as intentional wontfix with rationale (JS has no `PP` library equivalent).
