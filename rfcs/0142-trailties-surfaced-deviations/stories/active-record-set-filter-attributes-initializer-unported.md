---
title: "trailties: port active_record.set_filter_attributes; on_load(:active_record) runs before config/initializers"
status: draft
updated: 2026-11-27
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`activerecord/lib/active_record/railtie.rb:316-320` (Rails v8.0.5.2) defines:

```ruby
initializer "active_record.set_filter_attributes" do
  ActiveSupport.on_load(:active_record) do
    self.filter_attributes += Rails.application.config.filter_parameters
  end
end
```

`packages/trailties/lib/trailties/active-record.ts` has no such initializer. It belongs between `active_record.clear_active_connections` and `active_record.set_signed_id_verifier_secret` in the Rails order.

Adding it is not enough. trails#10823 tried, and `configuration_test.rb:3845` "ActiveRecord::Base.filter_attributes should equal to filter_parameters" still read `[]`. trails imports `ActiveRecord::Base` eagerly, so `onLoad("active_record")` fires when the initializer runs, before `config/initializers/*` have pushed to `filterParameters`. In Rails, Base loads lazily after the initializers. The `retry_jitter` test (`configuration_test.rb:3450`, `activejob/lib/active_job/railtie.rb:55`) fails for the same reason.

## Acceptance criteria

- [ ] `active_record.set_filter_attributes` is ported at its Rails position, with the Rails body (`filterAttributes = [...filterAttributes, ...config.filterParameters]` inside `onLoad("active_record")`).
- [ ] `on_load(:active_record)` hooks registered during initialization run after `config/initializers`, as Rails' lazy `ActiveRecord::Base` load makes them. If that needs a separate story, link it as a dep.
- [ ] `configuration_test.rb:3845` is ported under its Rails name in `packages/trailties/test/application/configuration.test.ts` and passes.
