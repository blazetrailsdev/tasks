---
title: "attribute() and trails-tsc reject a dangerous attribute name"
status: claimed
updated: 2026-11-01
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-11-01T14:56:30Z"
assignee: "attribute-rejects-a-name-that-shadows-base"
blocked-by: null
closed-reason: null
---

this.attribute('changes','integer') on a model shadowed Base#changes silently at runtime; only the generated declare failed, as TS2415. Rails raises DangerousAttributeError (activerecord/lib/active_record/attribute_methods.rb, dangerous_attribute_method?). Expected: attribute() raises, and a schema column named changes is skipped by the generated accessors without a type error.
