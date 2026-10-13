---
title: "Port controller/routing_test.rb's RouteSetTest, lines 1207-1490 (the 17 tests cut from part 1)"
status: ready
updated: 2026-10-13
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 330
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`port-controller-routing-test-route-set-part-1` took `RouteSetTest`
(`vendor/rails/v8.0.2/actionpack/test/controller/routing_test.rb:1007-1994`)
lines 1007-1499 and shipped the first 19 of its 36 tests; the PR LOC ceiling cut
the rest. 17 tests in Rails lines 1207-1490 are still missing from
`packages/actionpack/src/action-controller/controller/routing.test.ts`:

- `test_draw_default_route` (`:1207`), `test_route_with_parameter_shell` (`:1223`)
- `test_route_constraints_with_options_method_condition_is_valid` (`:1276`)
- `test_route_error_with_missing_controller` (`:1284`)
- `test_recognize_with_encoded_id_and_regex` (`:1292`)
- `test_recognize_with_http_methods` (`:1301`)
- `test_recognize_with_alias_in_conditions` (`:1348`), `test_typo_recognition` (`:1363`)
- `test_routing_traversal_does_not_load_extra_classes` (`:1377`)
- `test_recognize_with_conditions_and_format` (`:1388`)
- `test_generate_with_default_action` (`:1412`), `test_root_map` (`:1422`)
- `test_namespace` (`:1430`), `test_namespaced_root_map` (`:1442`)
- `test_namespace_with_path_prefix` (`:1454`)
- `test_namespace_with_blank_path_prefix` (`:1466`)
- `test_id_is_sticky_when_it_ought_to_be` (`:1478`)

All 17 were ported and passed locally against `main` at `a554b9a207` with no
source change; the bodies below are that port, ready to paste under
`describe("RouteSetTest")`. `draw default route` and `route with parameter
shell` go before `route constraints on request object with anchors are valid`;
the rest go between `route constraints with anchor chars are invalid` and
`route constraints with unsupported regexp options must error`. They need
`UnknownHttpMethod` from `../metal/exceptions.js` and `rbModConstDefined` from
`@blazetrails/ruby-compat`, and the `// rescue nil` comment has to go
(`blazetrails/no-freeform-comments`; an empty `catch {}` then trips `no-empty`).

The two tests that already exist in that range still pass the route as
`this.get("page/:id", { to: ... })` where Rails writes
`get "page/:id" => "pages#show"`; converge them to
`this.get({ "page/:id": "pages#show", ... })` here.

```ts
it("draw default route", () => {
  set.draw(function () {
    deprecator().silence(() => {
      this.get(":controller/:action/:id");
    });
  });

  expect(set.routes.size).toBe(1);

  expect(tc.urlFor(set, { controller: "users", action: "show", id: 10 })).toBe("/users/show/10");
  expect(tc.urlFor(set, { controller: "users", id: 10 })).toBe("/users/index/10");

  expect(set.recognizePath("/users/index/10")).toEqual({
    controller: "users",
    action: "index",
    id: "10",
  });
  expect(set.recognizePath("/users/index/10/")).toEqual({
    controller: "users",
    action: "index",
    id: "10",
  });
});
it("route with parameter shell", async () => {
  set.draw(function () {
    this.get({ "page/:id": "pages#show", id: /\d+/ });

    deprecator().silence(() => {
      this.get("/:controller(/:action(/:id))");
    });
  });

  expect(await tc.requestPathParams("/pages")).toEqual({ controller: "pages", action: "index" });
  expect(await tc.requestPathParams("/pages/index")).toEqual({
    controller: "pages",
    action: "index",
  });
  expect(await tc.requestPathParams("/pages/list")).toEqual({
    controller: "pages",
    action: "list",
  });

  expect(await tc.requestPathParams("/pages/show/10")).toEqual({
    controller: "pages",
    action: "show",
    id: "10",
  });
  expect(await tc.requestPathParams("/page/10")).toEqual({
    controller: "pages",
    action: "show",
    id: "10",
  });
});

it("route constraints with options method condition is valid", () => {
  expect(() => {
    set.draw(function () {
      this.match({ "valid/route": "pages#show", via: "options" });
    });
  }).not.toThrow();
});

it("route error with missing controller", async () => {
  set.draw(function () {
    this.get({ "/people": "missing#index" });
  });

  await expect(tc.requestPathParams("/people")).rejects.toThrow(RoutingError);
});

it("recognize with encoded id and regex", async () => {
  set.draw(function () {
    this.get({ "page/:id": "pages#show", id: /[a-zA-Z0-9+]+/ });
  });

  expect(await tc.requestPathParams("/page/10")).toEqual({
    controller: "pages",
    action: "show",
    id: "10",
  });
  expect(await tc.requestPathParams("/page/hello+world")).toEqual({
    controller: "pages",
    action: "show",
    id: "hello+world",
  });
});

it("recognize with http methods", async () => {
  set.draw(function () {
    this.get({ "/people": "people#index", as: "people" });
    this.post({ "/people": "people#create" });
    this.get({ "/people/:id": "people#show", as: "person" });
    this.put({ "/people/:id": "people#update" });
    this.patch({ "/people/:id": "people#update" });
    this.delete({ "/people/:id": "people#destroy" });
  });

  let params = await tc.requestPathParams("/people", { method: "get" });
  expect(params["action"]).toBe("index");

  params = await tc.requestPathParams("/people", { method: "post" });
  expect(params["action"]).toBe("create");

  params = await tc.requestPathParams("/people/5", { method: "put" });
  expect(params["action"]).toBe("update");

  params = await tc.requestPathParams("/people/5", { method: "patch" });
  expect(params["action"]).toBe("update");

  await expect(tc.requestPathParams("/people", { method: "bacon" })).rejects.toThrow(
    UnknownHttpMethod,
  );

  params = await tc.requestPathParams("/people/5", { method: "get" });
  expect(params["action"]).toBe("show");
  expect(params["id"]).toBe("5");

  params = await tc.requestPathParams("/people/5", { method: "put" });
  expect(params["action"]).toBe("update");
  expect(params["id"]).toBe("5");

  params = await tc.requestPathParams("/people/5", { method: "patch" });
  expect(params["action"]).toBe("update");
  expect(params["id"]).toBe("5");

  params = await tc.requestPathParams("/people/5", { method: "delete" });
  expect(params["action"]).toBe("destroy");
  expect(params["id"]).toBe("5");

  await expect(tc.requestPathParams("/people/5", { method: "post" })).rejects.toThrow(RoutingError);
});

it("recognize with alias in conditions", async () => {
  set.draw(function () {
    this.match({ "/people": "people#index", as: "people", via: "get" });
    this.root({ to: "people#index" });
  });

  let params = await tc.requestPathParams("/people", { method: "get" });
  expect(params["controller"]).toBe("people");
  expect(params["action"]).toBe("index");

  params = await tc.requestPathParams("/", { method: "get" });
  expect(params["controller"]).toBe("people");
  expect(params["action"]).toBe("index");
});

it("typo recognition", async () => {
  set.draw(function () {
    this.get({
      "articles/:year/:month/:day/:title": "articles#permalink",
      year: /\d{4}/,
      day: /\d{1,2}/,
      month: /\d{1,2}/,
    });
  });

  const params = await tc.requestPathParams("/articles/2005/11/05/a-very-interesting-article", {
    method: "get",
  });
  expect(params["action"]).toBe("permalink");
  expect(params["year"]).toBe("2005");
  expect(params["month"]).toBe("11");
  expect(params["day"]).toBe("05");
  expect(params["title"]).toBe("a-very-interesting-article");
});

it("routing traversal does not load extra classes", async () => {
  expect(rbModConstDefined(Object, "Profiler__"), "Profiler should not be loaded").toBe(false);
  set.draw(function () {
    this.get({ "/profile": "profile#index" });
  });

  try {
    await tc.requestPathParams("/profile");
  } catch {}

  expect(rbModConstDefined(Object, "Profiler__"), "Profiler should not be loaded").toBe(false);
});

it("recognize with conditions and format", async () => {
  set.draw(function () {
    this.get({ "people/:id": "people#show", as: "person" });
    this.put({ "people/:id": "people#update" });
    this.patch({ "people/:id": "people#update" });
    this.get({ "people/:id(.:format)": "people#show" });
  });

  let params = await tc.requestPathParams("/people/5", { method: "get" });
  expect(params["action"]).toBe("show");
  expect(params["id"]).toBe("5");

  params = await tc.requestPathParams("/people/5", { method: "put" });
  expect(params["action"]).toBe("update");

  params = await tc.requestPathParams("/people/5", { method: "patch" });
  expect(params["action"]).toBe("update");

  params = await tc.requestPathParams("/people/5.png", { method: "get" });
  expect(params["action"]).toBe("show");
  expect(params["id"]).toBe("5");
  expect(params["format"]).toBe("png");
});

it("generate with default action", () => {
  set.draw(function () {
    this.get("/people", { controller: "people", action: "index" });
    this.get("/people/list", { controller: "people", action: "list" });
  });

  const url = tc.urlFor(set, { controller: "people", action: "list" });
  expect(url).toBe("/people/list");
});

it("root map", async () => {
  set.draw(function () {
    this.root({ to: "people#index" });
  });

  const params = await tc.requestPathParams("", { method: "get" });
  expect(params["controller"]).toBe("people");
  expect(params["action"]).toBe("index");
});

it("namespace", async () => {
  set.draw(function () {
    this.namespace("api", () => {
      this.get({ inventory: "products#inventory" });
    });
  });

  const params = await tc.requestPathParams("/api/inventory", { method: "get" });
  expect(params["controller"]).toBe("api/products");
  expect(params["action"]).toBe("inventory");
});

it("namespaced root map", async () => {
  set.draw(function () {
    this.namespace("api", () => {
      this.root({ to: "products#index" });
    });
  });

  const params = await tc.requestPathParams("/api", { method: "get" });
  expect(params["controller"]).toBe("api/products");
  expect(params["action"]).toBe("index");
});

it("namespace with path prefix", async () => {
  set.draw(function () {
    this.scope({ module: "api", path: "prefix" }, () => {
      this.get({ inventory: "products#inventory" });
    });
  });

  const params = await tc.requestPathParams("/prefix/inventory", { method: "get" });
  expect(params["controller"]).toBe("api/products");
  expect(params["action"]).toBe("inventory");
});

it("namespace with blank path prefix", async () => {
  set.draw(function () {
    this.scope({ module: "api", path: "" }, () => {
      this.get({ inventory: "products#inventory" });
    });
  });

  const params = await tc.requestPathParams("/inventory", { method: "get" });
  expect(params["controller"]).toBe("api/products");
  expect(params["action"]).toBe("inventory");
});

it("id is sticky when it ought to be", async () => {
  tc.set = tc.makeSet(false);
  set = tc.set;

  set.draw(function () {
    deprecator().silence(() => {
      this.get(":controller/:id/:action");
    });
  });

  await tc.get(URI.parse("http://test.host/people/7/show"));

  expect(tc.controller!.urlFor({ action: "destroy", onlyPath: true })).toBe("/people/7/destroy");
});
```

## Acceptance criteria

- The 17 tests are ported in Rails order under `describe("RouteSetTest")`.
- The existing `route constraints …` tests in the range take the Rails
  hash-rocket route form.
