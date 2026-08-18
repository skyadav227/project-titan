/**
 * InterviewSetup
 *
 * Interview configuration screen.
 * Per interview-wireframe.md §6–19, interview-ui-spec.md §6–9.
 *
 * Allows the user to choose context sources, interview type, difficulty,
 * and duration. Validates before calling beginInterview().
 *
 * The backend owns final validation — client-side validation is UX only.
 */
import { useState, useEffect } from "react";
import { useInterview } from "../../contexts/InterviewContext";
import { useResume } from "../../contexts/ResumeContext";
import DashboardCard from "../dashboard/ui/DashboardCard";
import Button from "../ui/Button";
import Input from "../ui/Input";

// ── Source option card ────────────────────────────────────────────────────────
function SourceCard({ id, label, description, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      aria-pressed={selected}
      className={`
        text-left rounded-xl border p-4 transition-all duration-150
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60
        ${selected
          ? "border-white/30 bg-white/[0.06]"
          : "border-white/[0.07] bg-[#111] hover:border-white/15 hover:bg-white/[0.03]"
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
            selected
              ? "border-white bg-white"
              : "border-white/30"
          }`}
        >
          {selected && (
            <div className="w-1.5 h-1.5 rounded-full bg-black" />
          )}
        </div>

        <div>
          <p
            className={`text-sm font-medium ${
              selected ? "text-white" : "text-white/70"
            }`}
          >
            {label}
          </p>

          <p className="text-xs text-white/35 mt-0.5">
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}

// ── Pill option (interview type, difficulty, duration) ────────────────────────
function OptionPill({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`
        px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60
        ${
          selected
            ? "bg-white text-black"
            : "border border-white/[0.1] text-white/50 hover:border-white/20 hover:text-white/70"
        }
      `}
    >
      {label}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function InterviewSetup() {
  const { beginInterview, isLoading, uiState } = useInterview();
  const { activeResume } = useResume();

  const [mode, setMode] = useState("mixed");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeEnabled, setResumeEnabled] = useState(false);
  const [interviewType, setInterviewType] = useState("technical");
  const [difficulty, setDifficulty] = useState("adaptive");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [questionLimit, setQuestionLimit] = useState(10);
  const [errors, setErrors] = useState({});

  // Auto-enable resume if an active resume exists
  useEffect(() => {
    if (activeResume) {
      setResumeEnabled(true);
    }
  }, [activeResume]);

  const isStarting = uiState === "starting" || isLoading;

  // ── Validation ────────────────────────────────────────────────────────────
  function validate() {
    const e = {};

    if (mode === "company" && !company.trim()) {
      e.company = "Enter a company name.";
    }

    if (mode === "role" && !role.trim()) {
      e.role = "Enter a target role.";
    }

    if (mode === "job_description" && !jobDescription.trim()) {
      e.jobDescription = "Paste a job description.";
    }

    if (mode === "resume" && !resumeEnabled) {
      e.resume = "Enable resume to use resume mode.";
    }

    if (mode === "mixed") {
      const sources = [
        company.trim(),
        role.trim(),
        jobDescription.trim(),
        resumeEnabled,
      ].filter(Boolean);

      if (sources.length < 2) {
        e.mixed =
          "Select at least two context sources for mixed mode.";
      }
    }

    if (resumeEnabled && !activeResume) {
      e.resume =
        "You need an active resume. Upload one on the Resume page.";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!validate()) return;

    const config = {
      mode,
      company: company.trim() || undefined,
      role: role.trim() || undefined,
      jobDescription: jobDescription.trim() || undefined,
      useResume: resumeEnabled,
      resumeVersionId:
        resumeEnabled && activeResume
          ? activeResume.id || activeResume._id
          : undefined,
      interviewType,
      difficulty,
      durationMinutes,
      questionLimit,
    };

    beginInterview(config);
  }

  return (
    <div className="max-w-2xl mx-auto dash-card-enter">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">
          Start Interview
        </h1>

        <p className="mt-1 text-sm text-white/40">
          Configure your practice session.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>

        {/* ── Context source selection ──────────────────────────────── */}
        <DashboardCard className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-4">
            Interview Context
          </p>

          <p className="text-sm text-white/50 mb-4">
            Choose what TITAN uses to personalize your interview questions.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SourceCard
              id="company"
              label="Company"
              description="Questions grounded in a target company."
              selected={
                mode === "company" ||
                (mode === "mixed" && company.trim() !== "")
              }
              onClick={() => setMode("company")}
            />

            <SourceCard
              id="role"
              label="Role"
              description="Questions for a specific job role."
              selected={
                mode === "role" ||
                (mode === "mixed" && role.trim() !== "")
              }
              onClick={() => setMode("role")}
            />

            <SourceCard
              id="job_description"
              label="Job Description"
              description="Questions from an actual job posting."
              selected={mode === "job_description"}
              onClick={() => setMode("job_description")}
            />

            <SourceCard
              id="resume"
              label="Resume"
              description="Questions based on your experience."
              selected={mode === "resume"}
              onClick={() => {
                setMode("resume");
                setResumeEnabled(true);
              }}
            />

            <SourceCard
              id="mixed"
              label="Mixed"
              description="Combine multiple sources for a realistic interview."
              selected={mode === "mixed"}
              onClick={() => setMode("mixed")}
            />
          </div>

          {errors.mixed && (
            <p
              role="alert"
              className="mt-3 text-xs text-red-400 validation-enter"
            >
              {errors.mixed}
            </p>
          )}
        </DashboardCard>

        {/* ── Contextual input fields ───────────────────────────────── */}
        {(mode === "company" || mode === "mixed") && (
          <DashboardCard className="mb-4 dash-card-enter">
            <div className="flex flex-col gap-4">
              <Input
                id="company"
                label="Target Company"
                placeholder="e.g. Google, Microsoft, Infosys"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                error={errors.company}
              />

              <Input
                id="role-company"
                label="Target Role"
                placeholder="e.g. Software Engineer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
          </DashboardCard>
        )}

        {mode === "role" && (
          <DashboardCard className="mb-4 dash-card-enter">
            <Input
              id="role"
              label="Target Role"
              placeholder="e.g. Full Stack Developer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              error={errors.role}
              required
            />
          </DashboardCard>
        )}

        {(mode === "job_description" || mode === "mixed") && (
          <DashboardCard className="mb-4 dash-card-enter">
            <label
              htmlFor="jd"
              className="block text-xs font-medium text-white/50 mb-2"
            >
              Job Description
            </label>

            <textarea
              id="jd"
              rows={6}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="
                w-full bg-white/[0.03] border border-white/[0.08] rounded-lg
                px-3 py-2.5 text-sm text-white/80 placeholder-white/25
                resize-none focus:outline-none focus:border-white/20 auth-input
              "
            />

            {errors.jobDescription && (
              <p
                role="alert"
                className="mt-1.5 text-xs text-red-400 validation-enter"
              >
                {errors.jobDescription}
              </p>
            )}
          </DashboardCard>
        )}

        {(mode === "resume" || mode === "mixed") && (
          <DashboardCard className="mb-4 dash-card-enter">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">
                  Resume
                </p>

                {activeResume ? (
                  <p className="text-xs text-white/40 mt-0.5">
                    Using:{" "}
                    <span className="text-white/60">
                      {activeResume.fileName}
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-red-400/80 mt-0.5">
                    No active resume.{" "}
                    <a
                      href="/resume"
                      className="underline text-white/50"
                    >
                      Upload one first.
                    </a>
                  </p>
                )}
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={resumeEnabled}
                onClick={() =>
                  setResumeEnabled((value) => !value)
                }
                className={`
                  relative w-10 h-5 rounded-full transition-colors duration-150
                  focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60
                  ${
                    resumeEnabled
                      ? "bg-white/80"
                      : "bg-white/10"
                  }
                `}
              >
                <span
                  className={`
                    absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-black
                    transition-transform duration-150
                    ${
                      resumeEnabled
                        ? "translate-x-5"
                        : "translate-x-0"
                    }
                  `}
                />

                <span className="sr-only">
                  {resumeEnabled ? "Disable" : "Enable"} resume context
                </span>
              </button>
            </div>

            {errors.resume && (
              <p
                role="alert"
                className="mt-2 text-xs text-red-400 validation-enter"
              >
                {errors.resume}
              </p>
            )}
          </DashboardCard>
        )}

        {/* ── Interview type ────────────────────────────────────────── */}
        <DashboardCard className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-3">
            Interview Type
          </p>

          <div className="flex flex-wrap gap-2">
            {[
              { id: "technical", label: "Technical" },
              { id: "behavioral", label: "Behavioral" },
              { id: "mixed", label: "Mixed" },
              { id: "role_specific", label: "Role-Specific" },
            ].map((option) => (
              <OptionPill
                key={option.id}
                label={option.label}
                selected={interviewType === option.id}
                onClick={() => setInterviewType(option.id)}
              />
            ))}
          </div>
        </DashboardCard>

        {/* ── Difficulty ────────────────────────────────────────────── */}
        <DashboardCard className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-3">
            Difficulty
          </p>

          <div className="flex flex-wrap gap-2">
            {[
              { id: "adaptive", label: "Adaptive (recommended)" },
              { id: "easy", label: "Easy" },
              { id: "medium", label: "Medium" },
              { id: "hard", label: "Hard" },
            ].map((option) => (
              <OptionPill
                key={option.id}
                label={option.label}
                selected={difficulty === option.id}
                onClick={() => setDifficulty(option.id)}
              />
            ))}
          </div>

          {difficulty === "adaptive" && (
            <p className="mt-3 text-xs text-white/30">
              Adaptive difficulty adjusts based on your performance
              during the interview.
            </p>
          )}
        </DashboardCard>

        {/* ── Duration + question count ─────────────────────────────── */}
        <DashboardCard className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-3">
            Session Length
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <p className="text-xs text-white/40 mb-2">
                Duration
              </p>

              <div className="flex flex-wrap gap-2">
                {[15, 30, 45, 60].map((duration) => (
                  <OptionPill
                    key={duration}
                    label={`${duration} min`}
                    selected={durationMinutes === duration}
                    onClick={() =>
                      setDurationMinutes(duration)
                    }
                  />
                ))}
              </div>
            </div>

            <div className="flex-1">
              <p className="text-xs text-white/40 mb-2">
                Questions
              </p>

              <div className="flex flex-wrap gap-2">
                {[5, 8, 10, 15].map((questionCount) => (
                  <OptionPill
                    key={questionCount}
                    label={`${questionCount}`}
                    selected={questionLimit === questionCount}
                    onClick={() =>
                      setQuestionLimit(questionCount)
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        </DashboardCard>

        {/* ── Submit ───────────────────────────────────────────────── */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isStarting}
          disabled={isStarting}
        >
          {isStarting
            ? "Preparing your interview..."
            : "Start Interview"}
        </Button>
      </form>
    </div>
  );
}

