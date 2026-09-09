---
title: "DebugExceptions picks XML for a browser's Accept header, so every 500 renders as an <error> document"
status: draft
updated: 2026-09-09
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Every 500 the deployed trailmap serves to a BROWSER comes back as XML:

```text
$ curl -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' \
    http://127.0.0.1:8080/rfcs -o /dev/null -w '%{content_type}\n'
application/xml; charset=utf-8
```

The same request with `Accept: */*` gets HTML. Found alongside the
`ConnectionNotDefined` 500 in
[[deployed-rfcs-index-500s-with-connectionnotdefined]] and separated from it
there, because it will keep misrendering every future 500 after that one is
fixed.

## The negotiation path

`DebugExceptions.renderException`
(`packages/actionpack/src/action-dispatch/middleware/debug-exceptions.ts`,
shipped as `dist/actiondispatch/middleware/debug-exceptions.js:56-68`) picks
the format by SUBSTRING over the raw header:

```js
const accept = env["HTTP_ACCEPT"] ?? "";
if (accept.includes("application/json") || ...) return this.renderJsonError(wrapper, env);
if (accept.includes("application/xml") || accept.includes("text/xml")) return this.renderXmlError(wrapper);
return this.renderHtmlError(wrapper, env);
```

A browser's default `Accept` names `text/html` FIRST and `application/xml`
third, at `q=0.9`. `includes` cannot see either the order or the q-value, so
the lowest-ranked of the three formats wins, and a human reading the dashboard
gets an `<error>` document with no stylesheet.

Rails does not negotiate this way: `ActionDispatch::DebugExceptions#render_for_browser_request`
renders the HTML page for any request whose `request.formats.first` is HTML,
and only `render_for_api_request` produces the machine formats — the split is
by q-ordered format, not by substring. `PublicExceptions` in the same tree
already does the right thing
(`action-dispatch/middleware/public-exceptions.js:48-53`: `MimeType.parse(accept)[0]`),
which is the shape `DebugExceptions` should have.

Note the duplicated middleware trees, `action-dispatch/` and `actiondispatch/`:
the deployed process runs the latter. Whether both need the fix is part of the
story.

## Acceptance criteria

- A request with a browser's `Accept` header gets the HTML error page.
- Format selection is by q-ordered mime parse, not `String#includes`, matching
  `render_for_browser_request` / `render_for_api_request`.
- A test in trails covers a browser `Accept` header, an `application/json`
  one, and an explicit `application/xml` one.
- Fixed in trails, not worked around in trailmap.
