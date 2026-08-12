import { Link } from "react-router-dom";

const LINKS = [
  { label: "About", href: "#" },
  { label: "GitHub", href: "https://github.com", external: true },
  { label: "Privacy", href: "#" },
  { label: "Contact", href: "#" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      className="border-t border-white/[0.05] py-10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-md"
            aria-label="TITAN – home"
          >
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%)" }}
              aria-hidden="true"
            >
              <span className="text-black text-[10px] font-black">T</span>
            </div>
            <span className="text-white/70 font-semibold text-sm tracking-tight">TITAN</span>
          </Link>

          {/* Nav links */}
          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2" role="list">
              {LINKS.map(({ label, href, external }) => (
                <li key={label}>
                  {external ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-white/35 hover:text-white/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-sm"
                    >
                      {label}
                      <span className="sr-only"> (opens in new tab)</span>
                    </a>
                  ) : (
                    <Link
                      to={href}
                      className="text-xs text-white/35 hover:text-white/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-sm"
                    >
                      {label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Copyright */}
          <p className="text-xs text-white/20" aria-label={`Copyright ${year} TITAN`}>
            © {year} TITAN
          </p>

        </div>
      </div>
    </footer>
  );
}
