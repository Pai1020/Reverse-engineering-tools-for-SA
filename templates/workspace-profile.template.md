# Workspace Profile

<!--
  This is the WORKSPACE-level card — one level above per-repo profile cards.
  Place the filled copy at the PARENT FOLDER that contains all the repos as
  `.workspace-profile.md` (sibling of the repo directories, not inside any
  one of them).

  Use this when a "project" is actually multiple repos checked out side by
  side under one folder: a separated frontend + backend, or several
  microservices. Each listed repo keeps its OWN `.analysis-profile.md` at its
  own root, unchanged in format (see templates/analysis-profile.template.md
  §0 for the per-repo service_id/kind/base_url fields this card cross-refers
  to).

  Generate this automatically with the `workspace-discovery` skill (invoked
  by `/workspace-init`), or fill it by hand.

  FALLBACK CONTRACT: if this file does not exist, every skill/command in this
  plugin behaves exactly as in single-repo mode — this file is purely
  additive and nothing downstream requires it.
-->

## 1. Workspace identity

- **Workspace name**: <NAME — e.g. the overall system/product name>
- **One-line purpose**: <what the overall system does, across all services>

## 2. Service registry  <!-- REQUIRED: at least one row -->

> One row per repo under this parent folder. `path` is relative to this
> workspace-profile.md's own location. `service_id` must match the `service_id`
> in that repo's own `.analysis-profile.md` §0. **`purpose` must come from the
> user, not be silently inferred** — see `workspace-discovery` Step 3.

| service_id | path | kind | purpose | primary language/framework | base_url / aliases | profile card |
|------------|------|------|---------|----------------------------|---------------------|--------------|
| `<service_id>` | `<relative/path>` | frontend / backend / shared-lib / gateway | <one-line: what this service is for, confirmed with the user> | <e.g. Angular 17 / Spring Boot 3> | <host:port or "N/A"> | `<path>/.analysis-profile.md` |

## 3. Cross-service call matching

> How `dependency-analysis` decides an outbound call is "cross-service" (calls
> another row above) vs a genuine external third party. List any indirection
> that isn't a literal base_url match (e.g. a service-discovery name, a
> gateway path prefix, an env var holding the real host).

- **Matching notes**: <e.g. "gateway routes /api/billing/** to billing-api",
  "service names resolved via Consul — match by Consul service name, not host">
- **Known genuine external systems (not in the registry, do not try to match)**:
  <e.g. payment gateway, SMS provider, upstream partner system — or "none">

## 4. Workspace-level output & harness paths

- **Workspace docs root**: <e.g. `.analysis/docs` — cross-service artifacts
  like SERVICE-MAP.md land under `<this>/_workspace/`>
- **Workspace harness dir**: <e.g. `.analysis/harness` — run state for every
  service's analysis runs lives here, one run_id per run regardless of which
  service it targets>

## 5. Notes

- **Repo discovery method used**: <e.g. "scanned for pom.xml/package.json/angular.json
  under each immediate child folder">
- **Anything intentionally excluded from the registry**: <e.g. archived repos,
  infra/deploy-only repos — or "none">
