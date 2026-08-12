/**
 * ResumeProfile
 *
 * The active-state view. Shows the full candidate profile with all sections.
 * Empty optional sections (certifications, achievements) are omitted.
 * Provides Replace and Delete actions via the Overview card.
 */
import { useState } from "react";
import ResumeOverviewCard from "./ResumeOverviewCard";
import CandidateProfileSection from "./CandidateProfileSection";
import SkillsSection from "./SkillsSection";
import ExperienceSection from "./ExperienceSection";
import EducationSection from "./EducationSection";
import ProjectsSection from "./ProjectsSection";
import CertificationsSection from "./CertificationsSection";
import AchievementsSection from "./AchievementsSection";
import InterviewCTA from "./InterviewCTA";
import DeleteResumeModal from "./DeleteResumeModal";
import { useResume } from "../../contexts/ResumeContext";

export default function ResumeProfile() {
  const { activeResume } = useResume();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!activeResume) return null;
  const profile = activeResume.candidateProfile;

  return (
    <div className="flex flex-col gap-5">
      <ResumeOverviewCard onDeleteClick={() => setShowDeleteModal(true)} />

      {profile && (
        <>
          <CandidateProfileSection profile={profile} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <SkillsSection    skills={profile.skills} />
            <EducationSection education={profile.education} />
          </div>

          <ExperienceSection experience={profile.experience} />
          <ProjectsSection   projects={profile.projects} />
          <CertificationsSection certifications={profile.certifications} />
          <AchievementsSection   achievements={profile.achievements} />
        </>
      )}

      <InterviewCTA />

      {showDeleteModal && (
        <DeleteResumeModal onClose={() => setShowDeleteModal(false)} />
      )}
    </div>
  );
}
