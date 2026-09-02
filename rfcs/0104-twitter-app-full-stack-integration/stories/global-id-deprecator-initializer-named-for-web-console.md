---
title: "global-id-deprecator-initializer-named-for-web-console"
status: draft
updated: 2026-09-02
rfc: "0104-twitter-app-full-stack-integration"
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

`GlobalID::Railtie`'s deprecator initializer is registered under the name
`"web_console.deprecator"` in
`packages/trailties/src/trailties/global-id.ts:61`:

```ts
this.initializer("web_console.deprecator", (app) => {
  (app as TrailtieApp).deprecators?.set("globalId", GlobalID.deprecator());
});
```

`web_console` is an unrelated gem. Surfaced in review of PR #7413, which only
relocated the file (`packages/globalid/src/trailtie.ts` ->
`packages/trailties/src/trailties/global-id.ts`) and left the name untouched;
`git log` puts the name's origin at 80efb2cad, well before that PR.

The blocker on fixing it inline is that **`global_id/railtie.rb` is not
vendored** — `find vendor -name railtie.rb | grep -i global` returns nothing, so
there is no local source to check the name against. It matters which way the
answer falls, because upstream globalid may genuinely carry the same
copy-pasted name (the gem's railtie is a small file that has been through
several deprecator refactors), in which case the trails port is FAITHFUL and the
right outcome is to leave it and record why — not to "fix" it into a divergence.

Initializer names are load-bearing beyond cosmetics: they are what
`Initializable::Collection#tsort_each_child` (`initializable.rb:49`) matches
`before:` / `after:` against, so a rename changes what a future ordering
constraint can reference.

## Acceptance criteria

- [ ] Establish the upstream name from the real `global_id/railtie.rb` — either
      by adding globalid to the vendored sources (`vendor/sources.ts` /
      `pnpm vendor:fetch`) or by reading the published gem — and cite the
      `file:line`.
- [ ] If upstream is `"global_id.deprecator"`, rename ours to match.
- [ ] If upstream is `"web_console.deprecator"`, leave the name exactly as it
      is; the port is already faithful.
- [ ] Either way the decision is recorded against the cited upstream line, so
      the next reader does not re-open it.
