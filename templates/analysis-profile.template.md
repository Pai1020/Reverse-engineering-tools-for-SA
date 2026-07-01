# Project Analysis Profile

<!--
  This is the per-repo "profile card". Place the filled copy at THIS REPO'S
  ROOT as `.analysis-profile.md`. Every analysis/verification skill reads this
  file first. If a field is unknown, leave the placeholder and the skill will
  fall back to live auto-detection.

  Generate this automatically with the `analysis-init` skill, or fill it by hand.
  A filled real-world example is in:
  templates/examples/analysis-profile.example.md

  WORKSPACE MODE: if this repo lives alongside sibling repos under one parent
  folder (e.g. frontend + backend split, or several microservices), a
  `.workspace-profile.md` at the PARENT folder registers all of them as
  "services" — see templates/workspace-profile.template.md and the
  `workspace-discovery` skill. Fill §0 below so other repos' outbound calls
  can be matched back to this one. If this repo is standalone, leave §0 as-is
  and skip workspace mode entirely — nothing else in this card changes.
-->

## 0. Service identity (workspace mode only — leave blank if standalone)

- **service_id**: <short unique id used in the workspace registry, e.g. `billing-api`>
- **service_kind**: <frontend / backend / shared-lib / gateway / other>
- **Base URL / known aliases**: <host:port, internal DNS name, or gateway route
  prefix this service is reachable at — used to match OTHER repos' outbound
  calls back to this repo; comma-separate multiple aliases, or "N/A">

## 1. Project identity

- **Project name**: <NAME>
- **One-line purpose**: <what this system does>
- **Primary language(s)**: <e.g. Java / TypeScript / Python>
- **Repository root marker**: <e.g. pom.xml / package.json / Cargo.toml>

## 2. Build system & tech stack

- **Build tool**: <e.g. Maven multi-module / npm / Gradle / pip>
- **Frameworks**: <e.g. Spring 4 / React / Django>
- **Persistence / ORM**: <e.g. MyBatis + Oracle / Prisma + Postgres / none>
- **Web/UI layer**: <e.g. JSF+PrimeFaces / Next.js / none>
- **Web services / API style**: <e.g. SOAP(CXF) / REST(Spring MVC) / GraphQL / none>
- **Batch / scheduling**: <e.g. Spring Batch + Quartz / cron / none>
- **Build commands**: <e.g. `mvn clean install -DskipTests` / `npm run build`>
- **Test commands**: <e.g. `mvn test` / `npm test`>

## 3. Module / layer map  <!-- REQUIRED: fill at least one row -->

> Where each architectural layer lives. Use path globs relative to repo root.
> Add/remove rows to match the project. Skills use this to locate code.

| Layer / role | Path glob(s) | Notes |
|--------------|--------------|-------|
| Entry – UI pages | `<glob>` | <e.g. controllers, view templates> |
| Entry – Web service endpoints | `<glob>` | |
| Entry – REST API controllers | `<glob>` | |
| Entry – Batch jobs | `<glob>` | |
| Business / service layer | `<glob>` | |
| Data-access (mapper/repo/DAO) | `<glob>` | |
| Domain models / DTOs | `<glob>` | |
| Constants / enums | `<glob>` | |
| Shared utilities | `<glob>` | |
| DB migration scripts | `<glob>` | |

## 4. Entry-point types present  <!-- REQUIRED: tick at least one -->

> Tick the entry-point types this project has. The `sa` agent dispatches by
> entry-point type (UI / WS-API / Batch); orchestration skips inapplicable steps.

- [ ] UI pages
- [ ] SOAP / Web-service endpoints
- [ ] REST API endpoints
- [ ] Batch jobs
- [ ] CLI / standalone

**How to find an entry point**: <how a human/agent locates the entry for a
feature — e.g. "search xhtml under webapp", "controllers annotated @RestController">

## 5. Persistence conventions

- **Schema prefix in queries**: <e.g. `APP.` / `dbo.` / none>
- **Table naming**: <e.g. UPPER_SNAKE / snake_case>
- **Sequence / id strategy**: <e.g. `<TABLE>_SEQ.nextval` / auto-increment / UUID>
- **Multiple data sources / transaction managers**: <list names, or "single">
- **Code/value mapping tables or maps**: <e.g. external→internal code maps, or none>

## 6. Naming & code conventions to watch

- **Constant classes / pattern**: <e.g. `*Const.java` under constants/, or none>
- **Auto-generated vs hand-written code**: <e.g. generated mappers vs `ext/` hand-written>
- **Project-specific pitfalls**: <e.g. selective vs full update semantics,
  object-reference sharing, BigDecimal compare — or "none known">

## 7. Output documents  <!-- REQUIRED: set docs_root -->

- **Docs output root**: <e.g. `docs/analysis` / `.analysis/docs`>
- **Path convention**: <e.g. `<root>/<module>/<feature>/<page>/<function>/<TYPE>.md`>
- **Cross-feature overview location**: <e.g. `<root>/_global/<feature>-overview/`>

## 8. UI verification (optional — for playwright-verify)

- **App base URL**: <e.g. http://localhost:8080 — or "N/A: no running env">
- **Login flow**: <steps or "none" / "N/A">
- **Test credentials source**: <env var name — never hard-code secrets here>

> If this section is N/A, the `ui-verify` step is skipped and annotated as such.

## 9. Domain glossary (optional)

| Term | Meaning |
|------|---------|
| <term> | <definition> |

## 10. Working directory for orchestration state

- **Harness/run state dir**: <e.g. `.analysis/harness` — where orchestrators
  write run state.json / handoff files; defaults to `.analysis/harness` if unset>
