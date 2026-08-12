/**
 * CertificationsSection — Omitted entirely when empty.
 */
import DashboardCard from "../dashboard/ui/DashboardCard";

export default function CertificationsSection({ certifications }) {
  if (!Array.isArray(certifications) || certifications.length === 0) return null;

  return (
    <DashboardCard enterIndex={7}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-white/30 mb-4">Certifications</h3>
      <ul className="flex flex-col gap-3">
        {certifications.map((c, i) => (
          <li key={i} className="flex flex-col gap-0.5">
            <p className="text-sm font-medium text-white/80">{c.name}</p>
            <p className="text-xs text-white/40">
              {c.issuer}
              {c.date ? ` · ${c.date}` : ""}
            </p>
            {c.credentialUrl && (
              <a
                href={c.credentialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                View credential →
              </a>
            )}
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}
