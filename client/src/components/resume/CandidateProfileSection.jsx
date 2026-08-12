/**
 * CandidateProfileSection
 *
 * Compact info grid: name, target role, experience level.
 * Only renders fields that are present — never invents data.
 */
import DashboardCard from "../dashboard/ui/DashboardCard";

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-white/30 uppercase tracking-wide font-medium mb-0.5">{label}</p>
      <p className="text-sm text-white/85">{value}</p>
    </div>
  );
}

export default function CandidateProfileSection({ profile }) {
  if (!profile) return null;
  const { personal, careerPreferences } = profile;

  const name    = personal?.name;
  const role    = careerPreferences?.targetRole?.value;
  const level   = careerPreferences?.experienceLevel?.value;
  const location = personal?.location;
  const email   = personal?.email;

  // Don't render if nothing to show
  if (!name && !role && !level && !location && !email) return null;

  return (
    <DashboardCard enterIndex={2}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-white/30 mb-4">Candidate Profile</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
        <Field label="Name"        value={name} />
        <Field label="Target Role" value={role} />
        <Field label="Level"       value={level} />
        <Field label="Location"    value={location} />
        <Field label="Email"       value={email} />
      </div>
    </DashboardCard>
  );
}
