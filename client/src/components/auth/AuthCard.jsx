/**
 * AuthCard
 * Centered card container for auth forms.
 * Provides the visual boundary, spacing, and entrance animation.
 * Keeps attention on the form — no competing elements.
 */
export default function AuthCard({ children }) {
  return (
    <div
      className="
        auth-card-enter
        w-full max-w-[420px]
        rounded-2xl
        border border-white/[0.08]
        bg-[#111111]/90
        shadow-2xl
        px-7 py-9
        sm:px-9 sm:py-10
      "
      style={{
        boxShadow:
          "0 0 0 1px rgba(255,255,255,0.05), 0 24px 64px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.3)",
        backdropFilter: "blur(20px)",
      }}
    >
      {children}
    </div>
  );
}
