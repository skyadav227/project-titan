/**
 * DashboardLayout
 *
 * The persistent shell for all authenticated pages.
 * Renders the sidebar (desktop) and a main content area.
 * On mobile, the sidebar is replaced by bottom navigation.
 *
 * Structure:
 *   <div class="dashboard-shell">
 *     <Sidebar />         ← desktop only
 *     <div class="main">
 *       <DashboardHeader />
 *       <main>{children}</main>
 *     </div>
 *     <MobileBottomNav />  ← mobile only
 *   </div>
 *
 * The sidebar width is 240px (fixed), set as a CSS variable so all
 * layout children can reference it without prop drilling.
 */
import { DashboardProvider } from "../contexts/DashboardContext";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import MobileBottomNav from "../components/dashboard/MobileBottomNav";

export default function DashboardLayout({ children }) {
  return (
    <DashboardProvider>
      {/*
        Shell: full viewport height.
        overflow-x-hidden prevents horizontal scroll at any breakpoint.
        On desktop: sidebar is fixed 240px, main area has lg:ml-[240px].
        On mobile:  single column, bottom nav pinned at bottom.
      */}
      <div className="min-h-screen bg-[#0a0a0a] text-white flex overflow-x-hidden">

        {/* ── Sidebar — hidden on mobile, fixed on desktop ── */}
        <DashboardSidebar />

        {/* ── Main area ── */}
        <div
          className="
            flex flex-col flex-1 min-w-0 w-full
            lg:ml-[240px]
          "
        >
          {/* Sticky header */}
          <DashboardHeader />

          {/*
            Page content.
            pb-20 on mobile leaves room above the fixed bottom nav (h-16 + safe area).
            On lg+, pb-8 since bottom nav is not shown.
          */}
          <main
            id="dashboard-content"
            className="
              flex-1
              px-4 py-6
              sm:px-6 sm:py-8
              lg:px-8 lg:py-8
              [padding-bottom:5rem]
              lg:[padding-bottom:2rem]
            "
          >
            {children}
          </main>
        </div>

        {/* ── Mobile bottom nav — hidden on lg+ ── */}
        <MobileBottomNav />

      </div>
    </DashboardProvider>
  );
}
