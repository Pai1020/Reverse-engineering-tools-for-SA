# 工作區設定卡（Workspace Profile）

<!--
  這是「工作區層級」的設定卡——比各 repo 自己的設定卡高一層。
  請把填好的檔案放在包含所有 repo 的「父資料夾」下，命名為
  `.workspace-profile.md`（與各 repo 目錄同層，不要放進任何一個 repo 裡）。

  當一個「專案」實際上是由多個並排存放在同一個資料夾下的 repo 組成時
  （前後端分離，或多個微服務），才需要這份卡片。每個列出的 repo
  仍會保留自己獨立的 `.analysis-profile.md`，格式不變（見
  templates/analysis-profile.template.md §0，這份卡片會交叉參照該處
  的 service_id/kind/base_url 欄位）。

  可用 `workspace-discovery` 技能（透過 `/workspace-init` 呼叫）自動產生，
  或手動填寫。

  後備機制（FALLBACK CONTRACT）：若此檔案不存在，本 plugin 的所有
  技能／指令行為會與單一 repo 模式完全相同——這份檔案純屬附加功能，
  沒有任何下游流程強制要求它存在。
-->

## 1. 工作區身分識別

- **工作區名稱**：<NAME —— 例如整體系統／產品名稱>
- **一句話說明用途**：<這個整體系統是做什麼的，橫跨所有服務>

## 2. 服務登錄表（Service registry）  <!-- 必填：至少一列 -->

> 每個位於此父資料夾下的 repo 各佔一列。`path` 是相對於這份
> workspace-profile.md 自身位置的相對路徑。`service_id` 必須與該 repo
> 自己 `.analysis-profile.md` §0 裡的 `service_id` 一致。**`purpose`
> 欄位必須來自使用者確認，不可由 AI 自行推測填入**——見
> `workspace-discovery` 技能 Step 3。

| service_id | path（路徑） | kind（類型） | purpose（用途） | 主要語言／框架 | base_url / 別名 | 設定卡路徑 |
|------------|------|------|---------|----------------------------|---------------------|--------------|
| `<service_id>` | `<relative/path>` | frontend / backend / shared-lib / gateway | <一句話：這個服務是做什麼的，已與使用者確認過> | <例如 Angular 17 / Spring Boot 3> | <host:port 或 "N/A"> | `<path>/.analysis-profile.md` |

## 3. 跨服務呼叫比對規則（Cross-service call matching）

> `dependency-analysis` 如何判斷一個對外呼叫是「跨服務」（呼叫上面登錄表
> 中的另一列）還是真正的外部第三方系統。請列出任何無法直接用 base_url
> 字面比對出來的間接關係（例如 service-discovery 名稱、API gateway 路徑
> 前綴、透過環境變數決定真實主機位置等）。

- **比對備註**：<例如「gateway 會將 /api/billing/** 路由到 billing-api」、
  「服務名稱透過 Consul 解析——請用 Consul 服務名稱比對，而非 host」>
- **已知的真正外部系統（不在登錄表內，不需嘗試比對）**：
  <例如金流閘道、簡訊供應商、上游合作夥伴系統——或填「無」>

## 4. 工作區層級的輸出與 harness 路徑

- **工作區文件輸出根目錄**：<例如 `.analysis/docs`——跨服務產出物
  （如 SERVICE-MAP.md）會放在 `<此路徑>/_workspace/` 下>
- **工作區 harness 目錄**：<例如 `.analysis/harness`——所有服務的分析
  執行狀態都存在這裡，每次執行一個 run_id，無論目標是哪個服務>

## 5. 備註

- **repo 探索方式**：<例如「掃描每個直屬子資料夾底下的
  pom.xml/package.json/angular.json」>
- **刻意排除於登錄表之外的項目**：<例如已封存的 repo、僅供
  infra/部署用途的 repo——或填「無」>
