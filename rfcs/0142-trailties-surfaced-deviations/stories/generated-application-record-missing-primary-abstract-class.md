---
title: "Generated ApplicationRecord omits primary_abstract_class"
status: draft
updated: 2026-09-15
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' app template `railties/lib/rails/generators/rails/app/templates/app/models/application_record.rb.tt:1-3` is:

```ruby
class ApplicationRecord < ActiveRecord::Base
  primary_abstract_class
end
```

trails' `packages/trailties/src/generators/app-generator.ts:625-632` generates `app/models/application-record.ts` with an empty class body (`tsClass({ name: "ApplicationRecord", extends: ref("Base"), body: [] })`), so the `primary_abstract_class` call is missing. trails#7795 fixed the import (from `ActiveRecord.Base` to `Base`) but left the body empty. The activerecord side already has the port: `primaryAbstractClass` in `packages/activerecord/src/inheritance.ts:373`.

## Acceptance criteria

- The generated `application-record.ts` calls the trails spelling of `primary_abstract_class` in the class body, mirroring the `.tt` template.
- The `app-generator.test.ts` snapshot is updated, and the generated file typechecks against `@blazetrails/activerecord`.
