/**
 * ResumeReview
 *
 * Shown after processing succeeds but before activation.
 * User sees the extracted profile and confirms with "Use This Resume".
 * For replacement flows, this is the confirmation step before V2 becomes active.
 */
import { useResume } from "../../contexts/ResumeContext";
import DashboardCard from "../dashboard/ui/DashboardCard";
import Button from "../ui/Button";
import SkillsSection from "./SkillsSection";
import ExperienceSection from "./ExperienceSection";
import EducationSection from "./EducationSection";
import ProjectsSection from "./ProjectsSection";
import CertificationsSection from "./CertificationsSection";
import AchievementsSection from "./AchievementsSection";
import CandidateProfileSection from "./CandidateProfileSection";

export default function ResumeReview() {
  const { resumeVersion, activateResume, isReplacing, cancelReplacement } = useResume();
  if (!resumeVersion) return null;

  const profile = resumeVersion.candidateProfile;

  function handleActivate() {
    activateResume(resumeVersion.id);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header card */}
      <DashboardCard enterIndex={1}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/30 mb-1">
              Resume Ready for Review
            </p>
            <p className="text-sm font-medium text-white/80 truncate max-w-[260px]">
              {resumeVersion.fileName}
            </p>
            <p className="mt-0.5 text-xs text-white/40">
              TITAN has extracted your profile. Review it below.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isReplacing && (
              <Button variant="ghost" size="sm" onClick={cancelReplacement}>
                Keep Current Resume
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={handleActivate}>
              {isReplacing ? "Activate New Resume" : "Use This Resume"}
            </Button>
          </div>
        </div>
      </DashboardCard>

      {/* Profile sections */}
      {profile && (
        <>
          <CandidateProfileSection profile={profile} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <SkillsSection    skills={profile.skills} />
            <EducationSection education={profile.education} />
          </div>
          <ExperienceSection   experience={profile.experience} />
          <ProjectsSection     projects={profile.projects} />
          <CertificationsSection certifications={profile.certifications} />
          <AchievementsSection   achievements={profile.achievements} />
        </>
      )}
    </div>
  );
}
