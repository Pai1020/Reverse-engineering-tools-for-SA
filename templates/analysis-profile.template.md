# 專案分析設定卡（Project Analysis Profile）

<!--
  這是每個 repo 自己的「設定卡」。請把填好的檔案放在「這個 repo 的根目錄」，
  命名為 `.analysis-profile.md`。每個分析／驗證技能都會優先讀取這份檔案。
  若某個欄位不確定，可保留樣板中的預留位置，技能會退回即時自動偵測。

  可用 `analysis-init` 技能自動產生，或手動填寫。
  已填寫完成的實際範例在：
  templates/examples/analysis-profile.example.md

  工作區模式：如果這個 repo 與其他 repo 並排存放在同一個父資料夾下
  （例如前後端分離，或多個微服務），父資料夾下會有一份
  `.workspace-profile.md`，把所有 repo 登錄為「服務（service）」——
  詳見 templates/workspace-profile.template.md 與 `workspace-discovery`
  技能。請填寫下方 §0，讓其他 repo 對外呼叫時能對應回這個 repo。
  若這個 repo 是獨立專案，§0 保持原樣即可，完全略過工作區模式——
  這份卡片其他部分不受影響。
-->

## 0. 服務身分識別（僅工作區模式使用——若為獨立 repo 可留空）

- **service_id**：<工作區登錄表使用的簡短唯一識別碼，例如 `billing-api`>
- **service_kind**：<frontend / backend / shared-lib / gateway / other>
- **Base URL / 已知別名**：<可連線到此服務的 host:port、內部 DNS 名稱，
  或 gateway 路由前綴——用於比對「其他 repo」對外呼叫是否指向這個
  repo；多個別名以逗號分隔，或填 "N/A">

## 1. 專案身分識別

- **專案名稱**：<NAME>
- **一句話說明用途**：<這個系統是做什麼的>
- **主要語言**：<例如 Java / TypeScript / Python>
- **repo 根目錄標記檔**：<例如 pom.xml / package.json / Cargo.toml>

## 2. 建置系統與技術堆疊

- **建置工具**：<例如 Maven multi-module / npm / Gradle / pip>
- **框架**：<例如 Spring 4 / React / Django>
- **持久層／ORM**：<例如 MyBatis + Oracle / Prisma + Postgres / 無>
- **Web/UI 層**：<例如 JSF+PrimeFaces / Next.js / 無>
- **Web services / API 風格**：<例如 SOAP(CXF) / REST(Spring MVC) / GraphQL / 無>
- **批次／排程**：<例如 Spring Batch + Quartz / cron / 無>
- **建置指令**：<例如 `mvn clean install -DskipTests` / `npm run build`>
- **測試指令**：<例如 `mvn test` / `npm test`>

## 3. 模組／分層對照表  <!-- 必填：至少填一列 -->

> 每個架構分層實際位於哪裡。路徑請用相對於 repo 根目錄的 path glob。
> 可依專案實際情況增減列數。各技能會依此定位程式碼位置。

| 分層／角色 (Layer / role) | 路徑 glob | 備註 |
|--------------|--------------|-------|
| Entry – UI 頁面 | `<glob>` | <例如 controllers、view templates> |
| Entry – Web service 端點 | `<glob>` | |
| Entry – REST API controllers | `<glob>` | |
| Entry – 批次工作 (Batch jobs) | `<glob>` | |
| 商業／服務層 (Business / service layer) | `<glob>` | |
| 資料存取層 (mapper/repo/DAO) | `<glob>` | |
| Domain models / DTOs | `<glob>` | |
| 常數／enum (Constants / enums) | `<glob>` | |
| 共用工具類 (Shared utilities) | `<glob>` | |
| DB migration 腳本 | `<glob>` | |

## 4. 存在的進入點類型  <!-- 必填：至少勾選一項 -->

> 勾選這個專案有的進入點類型。`sa` agent 會依進入點類型分派
> （UI / WS-API / Batch）；不適用的步驟會被 orchestration 跳過。

- [ ] UI 頁面
- [ ] SOAP / Web-service 端點
- [ ] REST API 端點
- [ ] 批次工作 (Batch jobs)
- [ ] CLI / 獨立程式

**如何找到進入點**：<人類或 agent 如何定位某個功能的進入點——
例如「在 webapp 底下搜尋 xhtml」、「標註 @RestController 的 controller」>

## 5. 持久層慣例

- **查詢中的 schema 前綴**：<例如 `APP.` / `dbo.` / 無>
- **資料表命名慣例**：<例如 UPPER_SNAKE / snake_case>
- **序號／id 策略**：<例如 `<TABLE>_SEQ.nextval` / 自動遞增 / UUID>
- **多個資料來源／transaction manager**：<列出名稱，或填「單一」>
- **代碼／值對照表或 map**：<例如外部→內部代碼對照表，或填「無」>

## 6. 需注意的命名與程式碼慣例

- **常數類別／命名模式**：<例如 constants/ 底下的 `*Const.java`，或填「無」>
- **自動產生 vs 手寫程式碼**：<例如自動產生的 mapper vs `ext/` 底下手寫的部分>
- **本專案特有的地雷／注意事項**：<例如 selective vs full update 語意差異、
  物件參照共用問題、BigDecimal 比較方式——或填「目前未知」>

## 7. 輸出文件  <!-- 必填：需設定 docs_root -->

- **文件輸出根目錄**：<例如 `docs/analysis` / `.analysis/docs`>
- **路徑慣例**：<例如 `<root>/<module>/<feature>/<page>/<function>/<TYPE>.md`>
- **跨功能總覽存放位置**：<例如 `<root>/_global/<feature>-overview/`>

## 8. UI 驗證設定（選填——供 playwright-verify 使用）

- **App base URL**：<例如 http://localhost:8080 —— 或填「N/A：無可用環境」>
- **登入流程**：<步驟說明，或填「無」/「N/A」>
- **測試帳密來源**：<環境變數名稱——絕對不要把機密資訊直接寫在這裡>

> 若這一節填 N/A，`ui-verify` 步驟會被跳過並標註原因。

## 9. 領域詞彙表（選填）

| 詞彙 | 意義 |
|------|------|
| <詞彙> | <定義> |

## 10. Orchestration 執行狀態的工作目錄

- **Harness/run state 目錄**：<例如 `.analysis/harness`——orchestrator
  寫入 run state.json / handoff 檔案的位置；未設定時預設為
  `.analysis/harness`>
