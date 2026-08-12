import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "FAQ", href: "#faq" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavClick = (href) => {
    setMenuOpen(false);
    const id = href.replace("#", "");
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      role="banner"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "backdrop-blur-xl bg-[#0a0a0a]/80 border-b border-white/[0.06]"
          : "bg-transparent"
      }`}
    >
      <nav
        aria-label="Main navigation"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between"
      >
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-md"
          aria-label="TITAN – home"
        >
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%)" }}
            aria-hidden="true"
          >
            <span className="text-black text-xs font-black tracking-tight">T</span>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">TITAN</span>
        </Link>

        {/* Desktop center links */}
        <ul className="hidden md:flex items-center gap-1" role="list">
          {NAV_LINKS.map(({ label, href }) => (
            <li key={label}>
              <button
                onClick={() => handleNavClick(href)}
                className="px-4 py-2 text-sm text-white/60 hover:text-white rounded-md transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 cursor-pointer"
              >
                {label}
              </button>
            </li>
          ))}
        </ul>

        {/* Desktop right actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors duration-150 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="btn-scale px-4 py-2 text-sm font-medium text-black bg-white rounded-md hover:bg-white/90 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            Start Free
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 cursor-pointer"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          <span
            className={`block h-px w-5 bg-white transition-transform duration-200 ${
              menuOpen ? "translate-y-[7px] rotate-45" : ""
            }`}
          />
          <span
            className={`block h-px w-5 bg-white transition-opacity duration-200 ${
              menuOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-px w-5 bg-white transition-transform duration-200 ${
              menuOpen ? "-translate-y-[7px] -rotate-45" : ""
            }`}
          />
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden animate-slide-down border-t border-white/[0.06] backdrop-blur-xl bg-[#0a0a0a]/95"
          role="navigation"
          aria-label="Mobile navigation"
        >
          <ul className="flex flex-col px-4 py-4 gap-1" role="list">
            {NAV_LINKS.map(({ label, href }) => (
              <li key={label}>
                <button
                  onClick={() => handleNavClick(href)}
                  className="w-full text-left px-4 py-3 text-sm text-white/70 hover:text-white rounded-md transition-colors cursor-pointer"
                >
                  {label}
                </button>
              </li>
            ))}
            <li className="pt-3 border-t border-white/[0.06] flex flex-col gap-2 mt-2">
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 text-sm text-white/70 hover:text-white text-center rounded-md transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 text-sm font-medium text-black bg-white rounded-md text-center hover:bg-white/90 transition-colors"
              >
                Start Free
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
