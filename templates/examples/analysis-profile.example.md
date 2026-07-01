# 專案分析設定卡（Project Analysis Profile）

<!--
  已填寫範例 —— 取材自一個真實的企業級 Java 專案（"ESP"）。
  可作為填寫 `.analysis-profile.template.md` 的參考。
  本檔案僅供示範說明，plugin 執行時不會載入此檔案。
-->

## 1. 專案身分識別

- **專案名稱**：ESP (Enterprise Service Platform)
- **一句話說明用途**：保險後勤作業系統（保費收據、郵寄、簡訊通知、
  法規申報、批次工作、後台管理）。
- **主要語言**：Java
- **repo 根目錄標記檔**：pom.xml（Maven multi-module）

## 2. 建置系統與技術堆疊

- **建置工具**：Apache Maven, multi-module, Java 8, UTF-8
- **框架**：Spring 4.0.4 (IoC/MVC/AOP/Security)、Spring Batch 3.0.10、
  Spring Integration、Spring Session + Redis
- **持久層／ORM**：MyBatis 3.5.6，主要資料庫 Oracle（透過 ojdbc6），
  另有 MS SQL（透過 jTDS）
- **Web/UI 層**：JSF 2.2 + PrimeFaces 6.0，含自訂 JSF 元件
- **Web services / API 風格**：SOAP（JAX-WS + Apache CXF 2.7.7）；
  REST（Spring MVC）
- **批次／排程**：Spring Batch + Quartz 2.3.2
- **建置指令**：`mvn clean install -DskipTests`
- **測試指令**：`mvn test`

## 3. 模組／分層對照表

| 分層／角色 (Layer / role) | 路徑 glob | 備註 |
|--------------|--------------|-------|
| Entry – UI 頁面 | `esp-system-ui/src/main/webapp/xhtml/**` | JSF XHTML 頁面 |
| Entry – UI controllers | `esp-system-ui/src/main/java/**/ui/**` | JSF ManagedBeans |
| Entry – Web service 端點 | `esp-remoting-server-web-service/**` | SOAP 端點繼承 BaseWS |
| Entry – REST API controllers | `esp-remoting-server-restful/**` | Spring MVC |
| Entry – 批次工作 (Batch jobs) | `esp-batch/**` | Spring Batch jobs/tasklets/chunks |
| 商業／服務層 (Business / service layer) | `esp-system-core/src/main/java/**/core/service/**` | |
| 資料存取層 (mapper) | `esp-system-core/src/main/java/**/mapper/**` | MyBatis 介面 + 同目錄 XML |
| 手寫 mapper | `esp-system-core/src/main/java/**/mapper/ext/**` | 自訂 SQL |
| Domain models / DTOs | `esp-system-core/src/main/java/**/mapper/model/**` | 自動產生 POJO + Example |
| 常數／enum (Constants / enums) | `esp-system-core/src/main/java/**/constant/**` | 例如 `*Const.java` |
| 共用工具類 (Shared utilities) | `esp-common-framework/**`, `**/core/common/**` | |
| DB migration 腳本 | `dbscript/**` | 依日期命名的資料夾 YYYYMMDD |

## 4. 存在的進入點類型

- [x] UI 頁面
- [x] SOAP / Web-service 端點
- [x] REST API 端點
- [x] 批次工作 (Batch jobs)
- [ ] CLI / 獨立程式

**如何找到進入點**：UI —— 找到 `.xhtml`，讀取 `<p:commandButton action=...>`
以定位 ManagedBean 的方法；WS —— 標註 `@WebService` 且繼承 `BaseWS` 的
端點類別；批次 —— 在批次工作 XML 中搜尋 Job ID（例如 `esp.job.premium.*`）。

## 5. 持久層慣例

- **查詢中的 schema 前綴**：`ESP.`（例如 `from ESP.PREMIUM_BATCH_PROC`）
- **資料表命名慣例**：UPPER_SNAKE
- **序號／id 策略**：透過 MyBatis `<selectKey>` 呼叫 `<TABLE>_SEQ.nextval`
- **多個資料來源／transaction manager**：`espTransactionManager`、
  `odsTransactionManager`（跨 TM 操作**不在**同一個 transaction 內）
- **代碼／值對照表**：例如 `PremiumConst.sendModeMapping` 會把外部 eBao
  代碼（`L/N/M/S`）對應到內部值（`01/02/04`）

## 6. 需注意的命名與程式碼慣例

- **常數類別／命名模式**：`core/constant/` 底下的 `*Const.java`
  （例如 `PremiumConst`、`EspConst`）；`Step` enum 存放批次 Job ID
- **自動產生 vs 手寫程式碼**：MyBatis 自動產生的 `XxxMapper`/`XxxMapper.xml`
  不可修改；需擴充時透過 `ext/XxxMapperExt`
- **本專案特有的地雷／注意事項**：
  - MyBatis `insert` vs `insertSelective`、`updateByPrimaryKey` vs
    `*Selective` 的差異（有 null 覆寫既有值的風險）
  - `@Transactional(REQUIRES_NEW)` 的獨立提交在外層 rollback 後仍會保留
  - 物件參照共用問題（例如 `data` 與 `list.get(0)` 其實是同一個實例）
  - `BigDecimal.equals` 會比較小數位數（scale）——應改用 `compareTo`

## 7. 輸出文件

- **文件輸出根目錄**：`.analysis/docs`
- **路徑慣例**：`<root>/<module>/<feature>/<page>/<function>/<TYPE>.md`
  （若 page 與 function 相同則合併為一層）
- **跨功能總覽存放位置**：`<root>/_global/<feature>-<entry>-overview/`

## 8. UI 驗證設定（選填）

- **App base URL**：N/A（分析用的 sandbox 沒有可用環境）
- **登入流程**：N/A
- **測試帳密來源**：N/A

## 9. 領域詞彙表（選填）

| 詞彙 | 意義 |
|------|------|
| eBao | 上游核心保險系統 |
| ODS | operational data store（維運資料儲存區） |
| premium receipt | 保費完稅（繳費）憑證 |

## 10. Orchestration 執行狀態的工作目錄

- **Harness/run state 目錄**：`.analysis/harness`
