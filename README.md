# MRA Group P&L Presentation Engine (P&L Deckify)

An executive-grade, interactive web-based presentation platform and financial modeling system built with **Next.js 14 (App Router)**, **React**, **Tailwind CSS**, and **Recharts**.

Designed to replace static Microsoft PowerPoint slides for corporate financial presentations, backed by dynamic Excel data integration from the MRA Group Summary Plan (2025–2031).

---

## 🌟 Key Features

1. **Executive 4-Quadrant Cockpit (`/p/[slug]`):**
   - **Quadrant 1:** Revenue & Net Profit Multi-Year Trajectory (2024–2031).
   - **Quadrant 2:** EBITDA (After Holding Cost) & Margin Expansion Trend (%).
   - **Quadrant 3:** Cost Structure Evolution (100% Stacked Bar: COGS vs OPEX vs Margin).
   - **Quadrant 4:** P&L Step-Down Waterfall Bridge with dynamic year selection.
   - **One-Click Zoom (`[⛶]`):** Smoothly expand any quadrant into full screen for deep-dive discussions, then press `Esc` to restore.
   - **Synchronized Hover:** Hovering a specific fiscal year simultaneously highlights that year across all 4 quadrants.
   - **Presenter Controls:** Shortcut keys for Fullscreen (`F`), Theme Toggle (`T`), and Screen Blackout (`B`).

2. **Admin Data Studio (`/admin`):**
   - **In-Browser Interactive Grid:** Click and edit any cell directly in your browser without opening Microsoft Excel.
   - **Formula Auto-Recalculate Engine:** Modifying Revenue or OPEX automatically updates Gross Profit, EBITDA, and Net Profit in real time.
   - **Excel Backend Uploader:** Drag and drop `.xlsx` workbooks to auto-sync sheets.
   - **Dynamic Unique Link Generation:** Save revisions as a new scenario to instantly receive a permanent, separate URL (e.g. `/p/mra-scenario-optimistic`) without overwriting previous presentation decks.

3. **Data Scope:**
   - 100% focused on pure **Profit & Loss (P&L)** consolidation.
   - Cashflow trajectory (CFO/CFI/CFF) is explicitly eliminated to ensure direct operational focus.

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+ or v20+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/halonemuinai-sys/Summary-Plan-MRA.git
cd Summary-Plan-MRA

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser:
- **Presentation Deck:** [http://localhost:3000/p/mra-altius-base-2025-2031](http://localhost:3000/p/mra-altius-base-2025-2031)
- **Admin Data Studio:** [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **UI & Styling:** Tailwind CSS, Lucide Icons
- **Visualizations:** Recharts (Combo Bar-Line, Area, 100% Stacked Bar, Waterfall Bridge)
- **Excel Processor:** SheetJS (`xlsx`)
- **Data Architecture:** Local JSON scenario snapshots with multi-tenant slug routing

---

## 📄 License
Confidential — PT Mugi Rekso Abadi (MRA Group) Corporate Planning & Finance.
