# Project Analysis Profile

<!--
  FILLED EXAMPLE — derived from a real enterprise Java project ("ESP").
  Use it as a reference for how to fill `.analysis-profile.template.md`.
  This file is illustrative only; it is NOT loaded by the plugin at runtime.
-->

## 1. Project identity

- **Project name**: ESP (Enterprise Service Platform)
- **One-line purpose**: back-office insurance operations (premium receipts,
  postal mail, messaging, regulatory reporting, batch jobs, admin).
- **Primary language(s)**: Java
- **Repository root marker**: pom.xml (Maven multi-module)

## 2. Build system & tech stack

- **Build tool**: Apache Maven, multi-module, Java 8, UTF-8
- **Frameworks**: Spring 4.0.4 (IoC/MVC/AOP/Security), Spring Batch 3.0.10,
  Spring Integration, Spring Session + Redis
- **Persistence / ORM**: MyBatis 3.5.6, Oracle (primary) via ojdbc6, MS SQL via jTDS
- **Web/UI layer**: JSF 2.2 + PrimeFaces 6.0, custom JSF components
- **Web services / API style**: SOAP via JAX-WS + Apache CXF 2.7.7; REST via Spring MVC
- **Batch / scheduling**: Spring Batch + Quartz 2.3.2
- **Build commands**: `mvn clean install -DskipTests`
- **Test commands**: `mvn test`

## 3. Module / layer map

| Layer / role | Path glob(s) | Notes |
|--------------|--------------|-------|
| Entry – UI pages | `esp-system-ui/src/main/webapp/xhtml/**` | JSF XHTML pages |
| Entry – UI controllers | `esp-system-ui/src/main/java/**/ui/**` | JSF ManagedBeans |
| Entry – Web service endpoints | `esp-remoting-server-web-service/**` | SOAP endpoints extend BaseWS |
| Entry – REST API controllers | `esp-remoting-server-restful/**` | Spring MVC |
| Entry – Batch jobs | `esp-batch/**` | Spring Batch jobs/tasklets/chunks |
| Business / service layer | `esp-system-core/src/main/java/**/core/service/**` | |
| Data-access (mapper) | `esp-system-core/src/main/java/**/mapper/**` | MyBatis interfaces + co-located XML |
| Hand-written mappers | `esp-system-core/src/main/java/**/mapper/ext/**` | custom SQL |
| Domain models / DTOs | `esp-system-core/src/main/java/**/mapper/model/**` | generated POJOs + Example |
| Constants / enums | `esp-system-core/src/main/java/**/constant/**` | e.g. `*Const.java` |
| Shared utilities | `esp-common-framework/**`, `**/core/common/**` | |
| DB migration scripts | `dbscript/**` | dated folders YYYYMMDD |

## 4. Entry-point types present

- [x] UI pages
- [x] SOAP / Web-service endpoints
- [x] REST API endpoints
- [x] Batch jobs
- [ ] CLI / standalone

**How to find an entry point**: UI — locate `.xhtml`, read `<p:commandButton action=...>`
to find the ManagedBean method; WS — endpoint class annotated `@WebService` extending
`BaseWS`; Batch — Job ID (e.g. `esp.job.premium.*`) searched in batch job XML.

## 5. Persistence conventions

- **Schema prefix in queries**: `ESP.` (e.g. `from ESP.PREMIUM_BATCH_PROC`)
- **Table naming**: UPPER_SNAKE
- **Sequence / id strategy**: `<TABLE>_SEQ.nextval` via MyBatis `<selectKey>`
- **Multiple data sources / transaction managers**: `espTransactionManager`,
  `odsTransactionManager` (cross-TM operations are NOT in one transaction)
- **Code/value mapping**: e.g. `PremiumConst.sendModeMapping` maps external eBao
  codes (`L/N/M/S`) to internal values (`01/02/04`)

## 6. Naming & code conventions to watch

- **Constant classes / pattern**: `*Const.java` (e.g. `PremiumConst`, `EspConst`)
  under `core/constant/`; `Step` enums hold batch Job IDs
- **Auto-generated vs hand-written**: MyBatis-generated `XxxMapper`/`XxxMapper.xml`
  must not be edited; extend via `ext/XxxMapperExt`
- **Project-specific pitfalls**:
  - MyBatis `insert` vs `insertSelective`, `updateByPrimaryKey` vs `*Selective`
    (null overwrite risk)
  - `@Transactional(REQUIRES_NEW)` independent commits survive outer rollback
  - object-reference sharing (e.g. `data` and `list.get(0)` same instance)
  - `BigDecimal.equals` compares scale — use `compareTo`

## 7. Output documents

- **Docs output root**: `.analysis/docs`
- **Path convention**: `<root>/<module>/<feature>/<page>/<function>/<TYPE>.md`
  (merge page+function into one level when identical)
- **Cross-feature overview location**: `<root>/_global/<feature>-<entry>-overview/`

## 8. UI verification (optional)

- **App base URL**: N/A (no running env in analysis sandbox)
- **Login flow**: N/A
- **Test credentials source**: N/A

## 9. Domain glossary (optional)

| Term | Meaning |
|------|---------|
| eBao | upstream core insurance system |
| ODS | operational data store |
| premium receipt | tax certificate for premiums paid |

## 10. Working directory for orchestration state

- **Harness/run state dir**: `.analysis/harness`
