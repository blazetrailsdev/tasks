---
title: "define_attribute_methods rejects the Dirty attribute names"
status: done
updated: 2026-11-01
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9574
claim: "2026-11-01T14:56:30Z"
assignee: "attribute-rejects-a-name-that-shadows-base"
blocked-by: null
closed-reason: null
---

this.attribute('changes','integer') on a model shadowed Base#changes silently at runtime; only the generated declare failed, as TS2415. Rails raises DangerousAttributeError (activerecord/lib/active_record/attribute_methods.rb, dangerous_attribute_method?). Expected, as in Rails: defining attribute methods raises for `changes`, `changed`, `changedAttributes`, `previousChanges`, `changesToSave`, `savedChanges` and `changesApplied`, attribute() itself does not check, and a column of that name raises too. trails-tsc is unchanged, so its TS2415 stays. The rest of the set belongs to dangerous-attribute-methods-derive-from-base.
