/**
 * DevStateToggle
 *
 * Development-only utility that lets you toggle between
 * First-Time User and Returning User dashboard states
 * without touching any code.
 *
 * Renders a small fixed pill in the bottom-right corner.
 * Remove this component from DashboardPage before production.
 */
import { useDashboard } from "../../contexts/DashboardContext";

export default function DevStateToggle() {
  const { isFirstTimeUser, setIsFirstTimeUser } = useDashboard();

  return (
    <div
      className="
        fixed bottom-24 right-4 z-50
        lg:bottom-6 lg:right-6
        flex flex-col items-end gap-2
      "
      aria-label="Development toggle"
    >
      <div
        className="
          flex items-center gap-3
          px-3.5 py-2
          rounded-xl
          border border-white/[0.10]
          bg-[#0d0d0d]/90
          backdrop-blur-md
          shadow-xl
        "
      >
        <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider">
          Dev
        </span>

        <button
          onClick={() => setIsFirstTimeUser(!isFirstTimeUser)}
          className="
            flex items-center gap-2
            px-3 py-1.5
            text-xs font-medium
            rounded-lg
            border border-white/[0.10]
            text-white/60
            hover:text-white hover:border-white/20
            transition-all duration-150
            focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30
          "
          title="Toggle dashboard state"
        >
          <span
            className={`
              inline-block w-2 h-2 rounded-full flex-shrink-0
              ${isFirstTimeUser ? "bg-amber-400" : "bg-emerald-400"}
            `}
          />
          {isFirstTimeUser ? "First-Time User" : "Returning User"}
        </button>
      </div>
    </div>
  );
}
