---
title: "Model generator emits this.attribute() calls and extends Base instead of ApplicationRecord"
status: ready
updated: 2026-08-31
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: null
priority: 60
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`trails generate model` emits a class body Rails leaves empty, and inherits
from the wrong base.

Emitted by `node packages/trailties/bin/trails.js generate model User
handle:string display_name:string bio:string password_digest:string`:

```ts
import { Base } from "@blazetrails/activerecord";

export class User extends Base {
  static {
    this.attribute("handle", "string");
    this.attribute("display_name", "string");
    this.attribute("bio", "string");
    this.attribute("password_digest", "string");
  }
}
```

Two divergences from `packages/trailties/src/generators/model-generator.ts`:

1. **Inherits `Base`, not `ApplicationRecord`.** Rails'
   `vendor/rails/railties/lib/rails/generators/rails/model/templates/model.rb.tt`
   emits `class <%= class_name %> < <%= parent_class_name.classify %>`,
   which is `ApplicationRecord`. `trails new` already generates
   `src/app/models/application-record.ts`, and the _authentication_
   generator correctly emits `extends ApplicationRecord` — so the two
   generators disagree with each other.
2. **Emits `this.attribute(...)` per column.** Rails' template body is
   empty; attributes come from the schema. In trails, declaring an
   attribute explicitly **suppresses DB reflection** for that column, so the
   generated form is not merely redundant, it changes behaviour. The
   documented house style (`examples/twitter-clone/src/models/user.ts`, and
   this repo's README "zero-`declare`" section) is a model with no
   `attribute` calls whose types come from `db/schema.ts` via `trails-tsc`.

## Acceptance criteria

- Generated models `extends ApplicationRecord` and import it from
  `./application-record.js`, matching the authentication generator.
- The generated class body carries no `this.attribute()` calls — an empty
  `static {}` block or no block at all, mirroring `model.rb.tt`.
- The generated model type-checks under `trails-tsc --schema db/schema.ts`
  with attributes resolved from the schema.
- Generator snapshot tests updated.
