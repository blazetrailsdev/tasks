---
title: "Decide the view-directory naming convention: snake_case dirs or explicit templates forever"
status: done
updated: 2026-09-09
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 3
pr: trailmap#21
claim: "2026-09-09T14:31:34Z"
assignee: "snapshot-the-show-page-equivalence-before-it-goes-circular"
blocked-by: null
closed-reason: null
---

## Context

Every page controller in trailmap has to name its template explicitly:

```ts
this.render({ template: "rfc-pages/show", locals, status });
```

because the implicit lookup and the repo's file-naming convention disagree.
trails derives the view prefix with Rails' `underscore`, so
`RfcPagesController` looks for `app/views/rfc_pages/show`. Verified directly
rather than assumed — a probe subclass named `RfcPagesProbeController` fails
with:

```text
Missing template rfc_pages_probe/show
```

That is FAITHFUL to Rails, where `RfcPagesController` renders
`app/views/rfc_pages/`. It is not a framework bug and must not be filed as
one. The collision is with trailmap's own convention: every other file here
is kebab-case (`read-models-controller.ts`, `rfc-pages-controller.ts`), and
`app/views/rfc-pages/` was named to match.

Surfaced in blazetrailsdev/trailmap#11, which shipped `/rfc/<id>` and
`/story/<id>` and paid this cost twice.

## Why it needs deciding rather than leaving

`template:` on every render is a papered-over disagreement, and it is silent:
a controller that forgets it does not fall back, it 500s with a missing
template at request time. Each new page page pays it again, and the reason
lives only in a comment on two controllers.

## The options

1. **Rename the view directories to snake_case** (`app/views/rfc_pages/`),
   matching Rails and letting implicit render work. Costs one exception to
   the kebab-case rule, in the one place Rails' own lookup dictates the name.
2. **Keep kebab-case and keep naming templates explicitly**, and write the
   rule down in CLAUDE.md so it is a convention rather than a surprise.

Either is defensible; what is not defensible is the current state, where the
choice is implicit in two files.

### 3. Keep kebab-case AND render implicitly, by respelling the prefix once

Found while implementing, and the option actually taken (trailmap#21):

```ts
export class ApplicationController extends ActionController.Base {
  static controllerPath(): string {
    return super.controllerPath().replace(/_/g, "-");
  }
}
```

This is the option the first two were framed as excluding — kebab-case
directories with no `template:` anywhere — and it exists because
`controllerPath` is an override point rather than a fixed derivation.

**It is a deliberate deviation from Rails' derived value, taken through a hook
Rails itself supports.** Rails derives `controller_path` as
`name.delete_suffix("Controller").underscore`
(`actionpack/lib/abstract_controller/base.rb:127`), so `rfc_pages` is what the
base returns here too — the override respells its separator and nothing else.
What makes that legitimate rather than a monkey-patch:

- `controller_path` is a public class method in Rails, documented with its
  return value, not marked `:nodoc:`.
- The view lookup consumes it through that method: `local_prefixes` returns
  `[controller_path]` (`actionview/lib/action_view/view_paths.rb:76`), which
  trails mirrors as `localPrefixes` (`actionview/src/view-paths.ts`).
- Rails ships a writer for it — `controller_path=`
  (`actionview/lib/action_view/test_case.rb:26`) — so the value is settable by
  design.
- trails' own actionview suites subclass and override the static
  (`packages/actionview/src/view-paths.trails.test.ts`).

The cost is that the deviation is real and has to be written down, which is
what this story is for: an app reading `RfcPagesController` no longer finds its
templates where Rails' own derivation says they are.

**Chosen: option 3**, on the owner's call that the repository is kebab-case and
`app/views` should not be the one exception. Option 1 was implemented first and
reverted; the decision is recorded in trailmap's `CLAUDE.md` beside the
camelCase rule.

## Acceptance criteria

- One of the options is applied across every page controller — option 3, per
  the decision recorded above. A later option added while implementing counts
  only if it is written into this story, as this one now is.
- The rule is recorded in CLAUDE.md next to the camelCase convention.
- A controller that follows the rule renders without naming a template, OR
  the requirement to name one is stated where a new page's author will read it.
