# Reverse-engineering-tools-for-SA

一個協助專案經理／系統分析師（PM / SA, System Analyst）在逆向工程（reverse engineering）過程中整理專案現況的 agent 工具。
(An agent tool that helps a project manager / system analyst (SA) organize the current status of a project during reverse engineering.)

這是一套**跨專案的逆向工程工具箱（cross-project reverse-engineering toolkit）**，以 Claude Code 外掛（plugin）形式封裝：它會產出分層的分析文件，並將這些文件與實際程式碼進行核對（verify）——適用於**任何**程式碼庫，不論是單一 repo 的單體式（monolith）架構、前後端分離，或是多個微服務（microservices）並排存放在同一個父資料夾底下。
(It is a **cross-project reverse-engineering toolkit** for Claude Code, packaged as a plugin: it produces layered analysis documents and verifies them against the real code — for **any** codebase, whether it's a single-repo monolith, a separated frontend+backend, or several microservices checked out side by side under one parent folder.)

本工具建立在（並延伸自）`code-analysis-package` 方法論之上，針對本專案的需求新增了兩項能力：**多服務工作區支援（multi-service workspace support）**（跨 repo 依賴追蹤）以及**確定性的靜態分析事實層（deterministic static-analysis facts layer）**（以 tree-sitter 為基礎），以降低對純 LLM 閱讀的依賴，來取得 symbol／endpoint／table 等事實。
(Built on top of (and extending) the `code-analysis-package` methodology, with two additions for this project's needs: **multi-service workspace support** (cross-repo dependency tracking) and a **deterministic static-analysis facts layer** (tree-sitter based) that reduces reliance on pure LLM reading for symbol/endpoint/table facts.)

## 解耦合方式（How decoupling works）

- 這個 plugin 只提供**方法論**（「如何分析」，"how to analyse"）。
- 每個 repo 中的**設定卡（profile card）**（`.analysis-profile.md`）提供**事實資料（facts）**（module/layer 路徑、技術堆疊、schema 前綴、常數類別、輸出路徑、進入點類型）。
- 對於多 repo 目標，父資料夾下的**工作區設定檔（workspace profile）**（`.workspace-profile.md`）會將每個 repo 註冊為一個**服務（service）**（id、kind、base URL），以便將跨服務呼叫與真正的外部系統區分開來。
- 若沒有設定卡存在，各項技能（skills）會退回即時自動偵測（讀取 `pom.xml` / `package.json` 或掃描目錄）。

## 安裝（Install）

```bash
claude plugin marketplace add <this-repo-path-or-url>
claude plugin install sa-reverse-engineering-toolkit@sa-reverse-engineering-toolkit
claude plugin list      # confirm it installed
```

## 首次使用（First-time use）

**單一 repo：**
```
/analysis-init
```

**多 repo 工作區**（前後端分離，或多個微服務放在同一個父資料夾下）：
```
/workspace-init
```
這會探索相鄰的 repo、寫入 `.workspace-profile.md`，然後為每個尚未擁有設定卡的 repo 執行 `/analysis-init`。

## 執行分析／驗證（Run analysis / verification）

```
# Full pipeline (orchestrator dispatches each worker in dependency order)
/start-analysis analyse <FeatureOrEntryPoint>

# A single layer on its own
/dependency-analysis
/erd
/flowchart

# Spec-vs-code verification (produces verify-report.md with a diff_rate)
/verify-code verify <FeatureName>

# Workspace-only: cross-service dependency graph across every registered service
/workspace-map

# Consolidate human-review items into a tracked backlog, and (with `apply`) close the loop
/gap-review <FeatureName> [apply]

# PM/SA rollup: coverage grid, open-gaps summary, diff_rate trend, attention list
/analysis-dashboard

# Convert any analysis doc to a styled PDF
/md-to-pdf
```

## 產出內容（What it produces）

每個被分析功能會產出分層的分析文件（輸出路徑來自設定卡 §7；預設為
`.analysis/docs/[<SERVICE>/]<MODULE>/<FEATURE>/<PAGE>/<FUNCTION>/` —— `<SERVICE>` 這一段只會出現在工作區模式下）：

| 層級 (Layer) | 文件 (Document) | 技能 (Skill) | 適用範圍 (Applies) |
|-------|----------|-------|---------|
| 1 | `DEPENDENCIES.md` + `.json` | dependency-analysis | 全部 |
| 2 | `VARIABLE-LIST.md` + `.json` | variable-list | 全部 |
| 2 | `ERD.md` + `.json` | erd | 全部 |
| 2 | `FUNCTION-LIST.md` + `.json` | function-list | 全部 |
| 3 | `FLOWCHART.md` + `.json` | flowchart | 全部 |
| 3 | `BUSINESS-RULES.md` + `.json` | business-rules | 全部 |
| 3.5 | `UI-VERIFY.md` + 圖片 + `.json`（僅協調模式） | playwright-verify | 僅限 UI |
| 4a | `SD.md` + `.json` | sd | 全部 |
| 4b | `API-CONTRACT.md` + `.json` | api-contract | 僅限 WS/API |
| 4b | `SA.md` + `.json` | sa / sa-api / sa-batch | 全部（分派） |
| verify | `verify-report.md` | verify-spec | 自動（sa 之後）+ 可依需求執行 |
| workspace | `SERVICE-MAP.md` + `.json` | workspace-map | 僅限多 repo |
| gaps | `REQUIREMENT-GAPS.md` + `.json` | requirement-gaps | 依需求執行 |
| dashboard | `DASHBOARD.md` | analysis-dashboard | 依需求執行 |

所有 10 種主要文件類型現在都會同時輸出 markdown 與結構化 `.json` 附屬檔（同一份發現的投影，兩者一起重新產生，絕不會漂移不同步）。
(All 10 primary doc types now emit both markdown and a structured `.json` sidecar — a projection of the same findings, regenerated together, never left to drift.)

## 多服務工作區（Multi-service workspaces）

當父資料夾下存在 `.workspace-profile.md` 時（見 `workspace-discovery` / `/workspace-init`）：
- 每一筆輸出路徑、harness 執行記錄、以及 `runs.md` 的每一列都會多出一個 `service` 維度，讓同一份共用的 harness 可以追蹤所有服務的執行紀錄。
- `dependency-analysis` 會對分析功能所發出的每個對外呼叫進行分類：若與其他已註冊服務的 `base_url`／別名相符，會標記為 `[cross-service → <service_id>]`（記錄在「Cross-service calls」表格中），而不是被歸類為一般的外部系統。它**不會**自動遞迴進入被呼叫的 repo——那需要另外明確執行一次。
- `/workspace-map` 會將每個服務的跨服務發現彙整成一張圖：`SERVICE-MAP.md`（mermaid 圖 + 表格）與 `SERVICE-MAP.json`（節點＝服務，邊＝呼叫，含 protocol/path/confidence）。

單一 repo 的使用方式完全不受影響——以上都是附加功能，僅在 `.workspace-profile.md` 存在時才會啟用。

## 需求缺口與 PM/SA 儀表板（Requirement gaps & PM/SA dashboard）

每個產出文件都會標記「⚠️ 待人工確認事項」（`analysis-conventions` §11），並鏡射進各自的 `.json` 附屬檔。`requirement-gaps` 技能（`/gap-review`）會把同一個功能底下所有文件的這些項目彙整成一份**有追蹤狀態**的清單 `REQUIREMENT-GAPS.md`/`.json`（open / answered / resolved），並提供**閉環機制**：
(Every produced document flags "⚠️ items needing human review" — `requirement-gaps` (`/gap-review`) consolidates them across a feature into one tracked backlog with a status (open/answered/resolved), and closes the loop:)

```
/gap-review <FeatureName>          # 彙整（只讀，安全）
/gap-review <FeatureName> apply    # 彙整後，針對已回答的項目派工目標式重新分析（重用既有的 Mode B）
/gap-review                        # 跨所有已分析功能（及服務）彙總
```

`apply` 不會重新分析整份文件——它會把每一列答案對應到受影響的階段（重用 `analysis-orchestration` 既有的 Mode B 影響矩陣），只重新派工那些階段，然後重新核對該問題是否真的從重新產生的文件中消失，才會標記為 resolved。

`/analysis-dashboard` 彙整 `runs.md`、各階段品質分數、需求缺口彙總、以及（工作區模式下）`SERVICE-MAP.json`，產出一份可重複產生的 `DASHBOARD.md`：涵蓋度總表（每個功能 × 10 種文件類型的品質關卡狀態）、待解缺口摘要、`diff_rate` 趨勢、以及需要人工關注的項目清單。純粹是唯讀彙整，不會產生任何新的分析內容。

## 靜態分析事實層（Static-analysis facts layer）

`scripts/extract/` 是一個確定性的、以 tree-sitter/XML 為基礎的前置處理程序（pre-pass），會對每個 repo 的原始碼解析一次，並寫入 `.analysis/index/<service>/facts.json`——純粹的資料（symbols、REST endpoints、對外 HTTP 呼叫、DB 存取），不含任何解讀（interpretation）。各項技能會先以此作為「是否存在」相關陳述的事實依據（ground truth），再進行自由閱讀原始碼（見 `static-index` 技能），藉此減少對函式簽章／endpoint／資料表產生幻覺（hallucination）的情況。此功能為附加性質：若 `facts.json` 不存在，各項技能運作方式與先前完全相同。

**本階段涵蓋範圍**：Java（Spring Boot REST endpoints + DI 邊、MyBatis mapper XML，以及 JPA —— `@Entity`/`@Table`、repository 介面、`@Query` JPQL/native、衍生查詢方法 derived-query methods）、Angular（`HttpClient` 呼叫）、Vue SFC（`axios`/`$axios` 呼叫）。其他技術堆疊仍會退回純 LLM 閱讀，與此層加入前的行為相同。

```bash
cd scripts/extract && npm install        # one-time, needs network
node index.js <repo_path> --service <id> # writes facts.json, caches by content hash
```

## 流程管線（Pipeline / DAG）

`start-analysis` 會端到端執行完整的流程管線（pipeline）。每個產出文件的階段都會先經過 `quality-score` 把關（`score_10 >= 9.0`）才會進入下一階段，在 `sa` 之後還會接著自動執行驗證階段：

```
deps → (vars ‖ erd ‖ funcs) → flow → rules → [ui-verify: UI only]
     → sd → [api-contract: WS/API only] → sa
     → (vspec-mock ‖ vspec-e2e) → vspec-static → vspec-report   ← auto verify
```

`verify-code` 也可以獨立觸發，用以重新驗證既有的 `SD.md`，而不需要重新跑一次完整的分析流程：

```
verify-code (standalone): init → (mock ‖ e2e) → static → report → patch → diff_rate
```

**品質訊號與驗證訊號是分開的（Quality and verify signals are separate）**：
- `quality_score` 衡量分析文件的完整性與證據品質；下游階段執行前必須先達到 `quality_gate=passed`。
- `diff_rate` 衡量 `verify-report.md` 中 SD 與程式碼之間的一致性。
- `vspec-patch` 會先修補（patch）局部性的 D-XX 差異。若 `diff_rate` 超過自適應閾值（第 1 輪＝0.20，第 2 輪＝0.15，第 3 輪以上＝0.10），工具會記錄「建議人工審查／手動重新分析」，而不是進行大範圍的自動重新分析。

## 組成元件（Components）

- **23 個技能 (skills)**：analysis-init、analysis-conventions、analysis-orchestration、
  workspace-discovery、static-index、workspace-map、requirement-gaps、
  analysis-dashboard、dependency-analysis、variable-list、erd、function-list、
  flowchart、business-rules、playwright-verify、sd、api-contract、
  batch-analysis、sa、sa-api、sa-batch、verify-spec、md-to-pdf。
- **16 個代理 (agents)**：deps、vars、erd、funcs、flow、rules、ui-verify、sd、
  api-contract、sa、quality-score、vspec-mock、vspec-static、vspec-e2e、
  vspec-report、vspec-patch。
- **6 個指令 (commands)**：start-analysis、verify-code、workspace-init、
  workspace-map、gap-review、analysis-dashboard。
- **scripts/extract/**：靜態事實擷取 CLI（見上文）。
- **templates/**：`analysis-profile.template.md`（每個 repo 的設定卡）、
  `workspace-profile.template.md`（工作區／服務登錄卡）、
  `examples/analysis-profile.example.md`（已填寫的參考範例）、
  `schemas/`（全部 10 種文件類型 + `requirement-gaps` + `facts.json` 的 JSON schema）、
  `harness/`（run-state + handoff + verify-report + requirement-gaps 範本）、`pdf-style.css`。

## 設定卡（Profile cards）

- **每個 repo 的** `.analysis-profile.md` 記錄：身分識別、建置系統與技術堆疊、
  module/layer 對照表（路徑 globs）、進入點類型、持久層慣例
  （schema 前綴、id 策略、transaction manager）、
  命名慣例／注意事項、輸出文件路徑、選填的 UI 驗證設定、
  詞彙表、harness 狀態目錄，以及（§0）工作區模式所需的
  `service_id`/`service_kind`/`base_url`。可從 `templates/analysis-profile.template.md` 開始撰寫，或執行 `/analysis-init`。
- **工作區的** `.workspace-profile.md`（位於父資料夾，僅用於多 repo 目標）記錄服務登錄表、
  跨服務呼叫比對規則，以及工作區層級的輸出／harness 路徑。可從
  `templates/workspace-profile.template.md` 開始撰寫，或執行 `/workspace-init`。

切勿在任一設定卡中放入機密資訊（secrets）——只記錄環境變數名稱（env-var names）即可。

## 注意事項與限制（Notes & limitations）

- 安裝／使用指令依循 Claude Code CLI 的方式；實際介面依版本而異。
- 完整流程管線的協調（orchestration）使用原生的 Claude 子代理（subagents，透過 Task tool）。
- UI 驗證預設使用 Mock HTML，除非設定卡 §8 明確啟用，否則不會觸及正式環境（live environment）。
- 靜態事實擷取目前涵蓋 Java/Spring Boot（MyBatis + JPA）與
  Angular/Vue；其他技術堆疊／語言是已記錄在案、留待未來擴充的缺口，
  而非無聲失敗——各項技能會退回純 LLM 閱讀。
- 路由表擷取（Angular `Routes`、Vue-router）目前尚未被靜態事實層涵蓋；
  輸出路徑的推導仍需直接讀取 router/layout 檔案。
- 所有產出文件依 `analysis-conventions` §12 以繁體中文為主、英文為輔
  （程式碼識別字、框架關鍵字、mermaid node ID、原文引用除外）。
- `/analysis-dashboard` 與 `requirement-gaps` 的 Rollup 模式純粹彙整既有資料，
  若尚未執行過任何分析（`runs.md` 不存在），會明確告知而非顯示空白/零值。

## 驗證（供貢獻者使用，Validate for contributors）

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/validate-plugin.ps1
```
檢查 manifest 有效性、agent/skill 的 frontmatter、skill 參照關係，以及確認除了
`templates/examples/` 之外沒有殘留專案特定的硬編碼（hardcoding）。

## 授權（License）

MIT —— 詳見 [LICENSE](LICENSE)。本專案 fork 並延伸自
[code-analysis-package](https://github.com/jin576tw/code-analysis-package)。
