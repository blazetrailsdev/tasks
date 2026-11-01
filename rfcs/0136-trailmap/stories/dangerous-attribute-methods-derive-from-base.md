---
title: "dangerousAttributeMethods derives from Base as Rails does"
status: draft
updated: 2026-11-01
rfc: "0136-trailmap"
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
closed-reason: null
---

`dangerousAttributeMethods()` (packages/activerecord/src/attribute-methods.ts) is a hand-kept list. Rails derives the set from `Base.instance_methods` plus private methods, minus the superclass's (activerecord/lib/active_record/attribute_methods.rb:30-38), so every Base method is covered, e.g. other members of activemodel/lib/active_model/dirty.rb and activerecord/lib/active_record/attribute_methods/dirty.rb. Expected: derive the set from `Base.prototype`. Found on trails#9574.
