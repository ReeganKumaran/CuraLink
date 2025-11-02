import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Users,
  LineChart,
  Stethoscope,
  Brain,
  Globe,
  Zap,
  HeartPulse,
  Layers,
  Search,
  Award,
  Sun,
  Moon,
} from "lucide-react";
import {
  logo,
  frameImage,
  artboard1,
  artboard2,
  artboard3,
  artboard4,
  artboard5,
  artboard6,
  artboard7,
  artboard8,
  artboard9,
  artboard10,
  artboard11,
  artboard14,
  artboard15,
  artboard16,
  artboard18,
  logo_1,
} from "../assets/assets";

const themeConfig = {
  dark: {
    pageBg: "bg-midnight-950 text-white",
    gradientLayer: "bg-mesh-purple",
    orb1: "bg-primary-500/25",
    orb2: "bg-accent-500/25",
    orb3: "bg-primary-500/20",
    surfaceRaised:
      "border-white/10 bg-white/5 backdrop-blur-xl shadow-glow-sm text-white/90",
    surfaceTag:
      "border-white/20 bg-white/10 text-white/80 hover:border-white/40 hover:bg-white/15",
    primaryButton:
      "bg-gradient-to-r from-primary-500 via-primary-600 to-accent-500 text-white shadow-glow hover:-translate-y-0.5",
    secondaryButton:
      "border-white/20 bg-white/10 text-white/80 hover:border-white/30 hover:bg-white/15",
    muted: "text-white/70",
    faint: "text-white/60",
    card: "border-white/10 bg-white/5",
    cardHover: "hover:border-white/20 hover:bg-white/10 hover:shadow-glow",
    heroHighlight:
      "border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10",
    metricsCard: "border-white/5 bg-white/5",
    journeyCard: "border-white/10 bg-white/5",
    spotlightCard: "border-white/10 bg-white/5",
    marqueeImg: "opacity-60 hover:opacity-100 hover:brightness-125",
    marqueeSection: "border-y border-white/10 bg-black/30",
    ctaCard:
      "border-white/10 bg-gradient-to-br from-primary-500/20 via-midnight-900/80 to-black/80 text-white",
    footer:
      "border-t border-white/10 bg-black/50 text-white/60 hover:text-white transition-colors duration-300",
  },
  light: {
    pageBg:
      "bg-gradient-to-br from-white via-violet-50 to-slate-100 text-slate-900",
    gradientLayer:
      "bg-gradient-to-br from-white via-purple-100/60 to-slate-100",
    orb1: "bg-primary-300/30",
    orb2: "bg-accent-200/40",
    orb3: "bg-primary-200/30",
    surfaceRaised:
      "border-slate-200 bg-white/85 backdrop-blur-xl shadow-xl text-slate-800",
    surfaceTag:
      "border-slate-200 bg-white text-slate-700 hover:border-primary-200 hover:text-primary-600",
    primaryButton:
      "bg-gradient-to-r from-primary-500 via-primary-600 to-accent-500 text-white shadow-lg hover:-translate-y-0.5",
    secondaryButton:
      "border-slate-300 bg-white text-slate-700 hover:border-primary-200 hover:bg-white",
    muted: "text-slate-600",
    faint: "text-slate-500",
    card: "border-slate-200 bg-white",
    cardHover: "hover:border-primary-200 hover:bg-white hover:shadow-xl",
    heroHighlight:
      "border-slate-200 bg-white text-slate-700 hover:border-primary-200 hover:bg-primary-50",
    metricsCard: "border-slate-200 bg-white",
    journeyCard: "border-slate-200 bg-white/90",
    spotlightCard: "border-slate-200 bg-white",
    marqueeImg: "opacity-70 hover:opacity-100 hover:brightness-110",
    marqueeSection: "border-y border-slate-200 bg-white/80",
    ctaCard:
      "border-slate-200 bg-gradient-to-br from-white via-purple-100/80 to-slate-100 text-slate-900 shadow-2xl",
    footer:
      "border-t border-slate-200 bg-white/80 text-slate-500 hover:text-slate-800 transition-colors duration-300",
  },
};

const partnerLogos = [
  artboard1,
  artboard2,
  artboard3,
  artboard4,
  artboard5,
  artboard6,
  artboard7,
  artboard8,
  artboard9,
  artboard10,
  artboard11,
  artboard14,
  artboard15,
  artboard16,
  artboard18,
];

const heroHighlights = [
  "AI-personalized clinical trial matches",
  "Global network of research collaborators",
  "Patient-first onboarding & support",
];

const featureCards = [
  {
    title: "AI Trial Intelligence",
    description:
      "Instantly surface the most relevant clinical trials with precision matching and eligibility scoring.",
    icon: Sparkles,
    gradient: "from-primary-500/25 to-accent-500/15",
  },
  {
    title: "Therapeutic Care Teams",
    description:
      "Coordinate multidisciplinary teams to support patients throughout their research journey.",
    icon: Stethoscope,
    gradient: "from-midnight-500/25 to-primary-500/15",
  },
  {
    title: "Real-time Evidence Hub",
    description:
      "Stay ahead with live publications, protocols, and actionable outcome dashboards.",
    icon: LineChart,
    gradient: "from-accent-500/25 to-primary-500/15",
  },
  {
    title: "Enterprise-grade Security",
    description:
      "HIPAA-compliant infrastructure with continuous monitoring and adaptive access controls.",
    icon: ShieldCheck,
    gradient: "from-primary-500/20 to-midnight-500/20",
  },
  {
    title: "Global Community Exchange",
    description:
      "Activate researcher, sponsor, and advocacy communities with curated collaboration spaces.",
    icon: Users,
    gradient: "from-primary-500/20 to-accent-500/20",
  },
  {
    title: "Adaptive Learning Engine",
    description:
      "Leverage AI copilots to synthesize patient data into personalized guidance and next steps.",
    icon: Brain,
    gradient: "from-primary-500/25 to-white/5",
  },
];

const journeySteps = [
  {
    step: "01",
    title: "Profile & Discovery",
    description:
      "Patients answer adaptive questions while CuraLink's AI builds a rich wellness profile.",
    icon: Search,
  },
  {
    step: "02",
    title: "Precision Matching",
    description:
      "Our intelligence engine pairs each profile with high-fit trials, experts, and publications.",
    icon: Sparkles,
  },
  {
    step: "03",
    title: "Collaborative Planning",
    description:
      "Care teams co-create action plans, timelines, and resource kits within guided workspaces.",
    icon: Layers,
  },
  {
    step: "04",
    title: "Ongoing Navigation",
    description:
      "Monitor progress, engagement, and outcomes with real-time analytics and automated nudges.",
    icon: LineChart,
  },
];

const metrics = [
  {
    label: "Organizations connected",
    value: "4,600+",
    subtext: "Global network reach",
  },
  {
    label: "Patient satisfaction",
    value: "95%",
    subtext: "Personalized care journeys",
  },
  {
    label: "Average matching speed",
    value: "23 hrs",
    subtext: "From onboarding to insights",
  },
  {
    label: "Regulatory compliance",
    value: "100%",
    subtext: "HIPAA | GDPR | HITRUST",
  },
];

const spotlights = [
  {
    title: "Intelligent navigation for every journey",
    description:
      "Dynamic pathway builders translate complex medical criteria into clear, personalized actions.",
    icon: HeartPulse,
  },
  {
    title: "Always-on researcher copilots",
    description:
      "Equip teams with AI copilots that summarize protocols, highlight risk factors, and surface insights.",
    icon: Zap,
  },
  {
    title: "Human-centered collaboration",
    description:
      "Bring caregivers, clinicians, and trial coordinators together in a unified, secure workspace.",
    icon: Users,
  },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("curalink-theme") || "light";
    }
    return "light";
  });

  const isDark = theme === "dark";
  const palette = useMemo(() => themeConfig[theme], [theme]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("curalink-theme", theme);
    }
    document.documentElement.style.setProperty(
      "color-scheme",
      isDark ? "dark" : "light"
    );
  }, [theme, isDark]);

  const handleThemeToggle = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const accentLink = isDark
    ? "text-primary-200 hover:text-accent-200"
    : "text-primary-500 hover:text-primary-600";

  return (
    <div
      className={clsx(
        "relative min-h-screen overflow-hidden transition-colors duration-500",
        palette.pageBg
      )}
    >
      <div
        className={clsx(
          "absolute inset-0 -z-10 transition-colors duration-700",
          palette.gradientLayer
        )}
      />
      <div
        className={clsx(
          "absolute -top-48 -left-32 h-[420px] w-[420px] rounded-full blur-3xl transition-colors duration-700",
          palette.orb1
        )}
      />
      <div
        className={clsx(
          "absolute top-1/3 right-10 h-[360px] w-[360px] rounded-full blur-3xl transition-colors duration-700",
          palette.orb2
        )}
      />
      <div
        className={clsx(
          "absolute bottom-10 left-1/3 h-[420px] w-[420px] rounded-full blur-3xl transition-colors duration-700",
          palette.orb3
        )}
      />

      <button
        type="button"
        onClick={handleThemeToggle}
        className={clsx(
          "fixed right-6 top-6 z-40 inline-flex items-center gap-2 rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] transition-colors duration-300",
          palette.surfaceTag
        )}
      >
        {isDark ? (
          <Sun className="h-4 w-4 text-primary-200" />
        ) : (
          <Moon className="h-4 w-4 text-primary-500" />
        )}
        {isDark ? "Light" : "Dark"}
      </button>

      <header className="relative z-10">
        <nav className="container mx-auto px-6 pb-12 pt-12">
          <div
            className={clsx(
              "flex flex-col gap-6 rounded-3xl border px-6 py-6 transition duration-500 md:flex-row md:items-center md:justify-between",
              palette.surfaceRaised
            )}
          >
            <div className="flex items-center gap-3">
              <img
                src={theme == "dark" ? logo_1 : logo}
                alt="CuraLink Logo"
                className={clsx(
                  "h-15 w-32 rounded-xl border p-2",
                  isDark
                    ? "border-white/20 bg-white/10"
                    : "border-slate-200 bg-white"
                )}
              />
              <div>
                <p
                  className={clsx(
                    "text-sm uppercase tracking-[0.35em]",
                    palette.faint
                  )}
                >
                  CuraLink Platform
                </p>
                <p className="text-lg font-semibold">
                  Precision Healthcare Collaboration
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
              {/* <button
                onClick={() => navigate("/patient/onboarding")}
                className={clsx(
                  "rounded-full border px-5 py-2 transition-all duration-300",
                  palette.surfaceTag
                )}
              >
                Patient Onboarding
              </button>
              <button
                onClick={() => navigate("/researcher/onboarding")}
                className={clsx(
                  "rounded-full border px-5 py-2 transition-all duration-300",
                  palette.surfaceTag
                )}
              >
                Researcher Onboarding
              </button>
              <button
                onClick={() => navigate("/director-management")}
                className={clsx(
                  "rounded-full border px-6 py-2 text-white transition-transform duration-300",
                  palette.primaryButton
                )}
              >
                Director Portal
              </button> */}
              <button
                onClick={() => navigate("/login")}
                className={clsx(
                  "rounded-full border px-5 py-2 transition-all duration-300",
                  palette.surfaceTag
                )}
              >
                Sign In
              </button>
            </div>
          </div>
        </nav>
      </header>

      <section className="relative z-10">
        <div className="container mx-auto grid gap-16 px-6 pb-24 pt-6 lg:grid-cols-[1.05fr_1fr] lg:items-center">
          <div className="space-y-10">
            <div
              className={clsx(
                "inline-flex items-center gap-3 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em]",
                palette.surfaceTag
              )}
            >
              <Sparkles className="h-4 w-4 text-accent-300" />
              <span>Reimagining research access</span>
            </div>

            <div className="space-y-6">
              <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                <span className="gradient-text">
                  Connecting breakthrough research with the people who need it
                  now.
                </span>
              </h1>
              <p className={clsx("max-w-xl text-lg sm:text-xl", palette.muted)}>
                CuraLink aligns patients, caregivers, researchers, and sponsors
                through a single, intelligent platform. Navigate clinical trials
                with clarity, accelerate evidence generation, and humanize every
                outcome.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {heroHighlights.map((item) => (
                <div
                  key={item}
                  className={clsx(
                    "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm backdrop-blur-lg transition-all duration-300",
                    palette.heroHighlight
                  )}
                >
                  <ShieldCheck className="h-4 w-4 flex-shrink-0 text-primary-200" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <button
                onClick={() => navigate("/patient/onboarding")}
                className={clsx(
                  "btn-primary group h-14 rounded-full px-10 text-base tracking-wide transition-transform duration-300",
                  palette.primaryButton
                )}
              >
                Explore Patient Experience
                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => navigate("/researcher/onboarding")}
                className={clsx(
                  "flex h-14 items-center justify-center rounded-full border px-8 text-base font-semibold transition-all duration-300",
                  palette.secondaryButton
                )}
              >
                For Research Teams
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="relative">
            <div
              className={clsx(
                "absolute -left-10 -top-10 h-24 w-24 rounded-full blur-md transition-colors duration-700",
                isDark
                  ? "border border-white/20 bg-white/10"
                  : "border border-slate-200 bg-white/70"
              )}
            />
            <div
              className={clsx(
                "absolute right-12 top-12 h-16 w-16 rounded-full blur-lg transition-colors duration-700",
                isDark
                  ? "border border-white/20 bg-primary-500/30"
                  : "border border-slate-200 bg-primary-200/60"
              )}
            />
            <div
              className={clsx(
                "relative overflow-hidden rounded-[2.5rem] border p-1 backdrop-blur-2xl transition-colors duration-500",
                isDark
                  ? "border-white/15 bg-white/5 shadow-glow"
                  : "border-slate-200 bg-white/80 shadow-2xl"
              )}
            >
              <div
                className={clsx(
                  "relative overflow-hidden rounded-[2.25rem] border p-8 transition-colors duration-500",
                  isDark
                    ? "border-white/10 bg-black/40"
                    : "border-slate-200 bg-white"
                )}
              >
                <div
                  className={clsx(
                    "absolute -left-10 top-1/3 h-32 w-32 rounded-full blur-3xl transition-colors duration-700",
                    isDark ? "bg-primary-500/25" : "bg-primary-200/40"
                  )}
                />
                <div
                  className={clsx(
                    "absolute bottom-6 right-10 h-24 w-24 rounded-full blur-3xl transition-colors duration-700",
                    isDark ? "bg-accent-500/20" : "bg-accent-200/40"
                  )}
                />
                <img
                  src={frameImage}
                  alt="Platform preview"
                  className="relative z-10 w-full rounded-2xl object-cover shadow-2xl"
                />
                <div className="relative z-10 mt-6 grid gap-4 text-sm lg:grid-cols-2">
                  <div
                    className={clsx(
                      "rounded-2xl border px-4 py-4 backdrop-blur-xl transition-all duration-300",
                      palette.card,
                      palette.cardHover
                    )}
                  >
                    <p
                      className={clsx(
                        "text-xs uppercase tracking-[0.3em]",
                        palette.faint
                      )}
                    >
                      Match Confidence
                    </p>
                    <p className="mt-2 text-2xl font-semibold">92.4%</p>
                    <p className={clsx("mt-1 text-xs", palette.faint)}>
                      AI-calculated alignment with patient biomarkers
                    </p>
                  </div>
                  <div
                    className={clsx(
                      "rounded-2xl border px-4 py-4 backdrop-blur-xl transition-all duration-300",
                      palette.card,
                      palette.cardHover
                    )}
                  >
                    <p
                      className={clsx(
                        "text-xs uppercase tracking-[0.3em]",
                        palette.faint
                      )}
                    >
                      Readiness Index
                    </p>
                    <p className="mt-2 text-2xl font-semibold">1.4 days</p>
                    <p className={clsx("mt-1 text-xs", palette.faint)}>
                      Average time to trial engagement
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10">
        <div className="container mx-auto px-6">
          <div
            className={clsx(
              "grid gap-6 rounded-3xl border px-6 py-10 sm:grid-cols-2 lg:grid-cols-4",
              palette.card
            )}
          >
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className={clsx(
                  "flex flex-col gap-2 rounded-2xl border px-5 py-5 text-left transition-all duration-300",
                  palette.metricsCard,
                  palette.cardHover
                )}
              >
                <p
                  className={clsx(
                    "text-xs uppercase tracking-[0.35em]",
                    palette.faint
                  )}
                >
                  {metric.label}
                </p>
                <p className="text-4xl font-semibold">{metric.value}</p>
                <p className={clsx("text-sm", palette.muted)}>
                  {metric.subtext}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-6 py-24">
        <div className="container mx-auto space-y-12">
          <div className="flex flex-col gap-6 text-center">
            <span
              className={clsx(
                "mx-auto inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em]",
                palette.surfaceTag
              )}
            >
              <Zap className="h-4 w-4 text-primary-200" />
              Platform capabilities
            </span>
            <h2 className="text-4xl font-bold leading-tight sm:text-5xl">
              <span className="gradient-text">
                Built for intelligent, human-centered care coordination.
              </span>
            </h2>
            <p className={clsx("mx-auto max-w-3xl text-lg", palette.muted)}>
              CuraLink unifies trial discovery, patient engagement, and research
              operations. Every tool is infused with AI assistance and
              privacy-first design principles.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {featureCards.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className={clsx(
                    "group relative overflow-hidden rounded-3xl border p-8 transition-all duration-500",
                    palette.card,
                    palette.cardHover
                  )}
                >
                  <div
                    className={`absolute -top-24 right-[-120px] h-52 w-52 rounded-full bg-gradient-to-br ${feature.gradient} blur-3xl transition-opacity duration-500 group-hover:opacity-90`}
                  />
                  <div className="relative z-10 space-y-6">
                    <div
                      className={clsx(
                        "inline-flex h-14 w-14 items-center justify-center rounded-2xl border",
                        palette.card
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-semibold">
                        {feature.title}
                      </h3>
                      <p
                        className={clsx(
                          "text-sm leading-relaxed",
                          palette.muted
                        )}
                      >
                        {feature.description}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate("/login")}
                      className={clsx(
                        "inline-flex items-center text-sm font-semibold transition-colors duration-300",
                        accentLink
                      )}
                    >
                      Learn more
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-6 py-24">
        <div className="container mx-auto space-y-12">
          <div className="flex flex-col gap-4 text-center">
            <span
              className={clsx(
                "mx-auto inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em]",
                palette.surfaceTag
              )}
            >
              <Globe className="h-4 w-4 text-primary-200" />
              Care journey
            </span>
            <h2 className="text-4xl font-bold leading-tight sm:text-5xl">
              Coordinated steps from first match to lasting outcomes.
            </h2>
            <p className={clsx("mx-auto max-w-2xl text-lg", palette.muted)}>
              Guide patients with confidence and keep research teams aligned
              with automated touchpoints and transparent insights.
            </p>
          </div>

          <div className="relative grid gap-6 lg:grid-cols-4">
            <div
              className={clsx(
                "pointer-events-none absolute left-1/2 top-14 hidden h-px w-[90%] -translate-x-1/2 bg-gradient-to-r lg:block",
                isDark
                  ? "from-transparent via-white/30 to-transparent"
                  : "from-transparent via-slate-300 to-transparent"
              )}
            />
            {journeySteps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.step}
                  className={clsx(
                    "relative overflow-hidden rounded-3xl border p-8 text-left transition-all duration-500",
                    palette.journeyCard,
                    palette.cardHover
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={clsx(
                        "text-sm font-semibold uppercase tracking-[0.35em]",
                        palette.faint
                      )}
                    >
                      Step {step.step}
                    </span>
                    <div
                      className={clsx(
                        "flex h-12 w-12 items-center justify-center rounded-full border",
                        palette.card
                      )}
                    >
                      <Icon className="h-5 w-5 text-primary-200" />
                    </div>
                  </div>
                  <h3 className="mt-6 text-2xl font-semibold">{step.title}</h3>
                  <p
                    className={clsx(
                      "mt-4 text-sm leading-relaxed",
                      palette.muted
                    )}
                  >
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-6 py-24">
        <div className="container mx-auto grid gap-12 lg:grid-cols-[0.75fr_1fr] lg:items-center">
          <div className="space-y-6">
            <span
              className={clsx(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em]",
                palette.surfaceTag
              )}
            >
              <Award className="h-4 w-4 text-accent-200" />
              Why teams choose CuraLink
            </span>
            <h2 className="text-4xl font-bold leading-tight sm:text-5xl">
              Orchestrate smarter, faster decisions without losing sight of the
              human experience.
            </h2>
            <p className={clsx("max-w-xl text-lg", palette.muted)}>
              We bring clarity to every conversation, from clinical trial
              enrollment to long-term care coordination. CuraLink delivers
              visibility, trust, and measurable impact for every stakeholder.
            </p>
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <div
                className={clsx(
                  "rounded-2xl border px-5 py-5 backdrop-blur-xl transition-all duration-300",
                  palette.card,
                  palette.cardHover
                )}
              >
                <p
                  className={clsx(
                    "text-xs uppercase tracking-[0.35em]",
                    palette.faint
                  )}
                >
                  Deploy in
                </p>
                <p className="mt-2 text-2xl font-semibold">Under 30 days</p>
                <p className={clsx("mt-2 text-xs", palette.muted)}>
                  Configurable pathways & integrations
                </p>
              </div>
              <div
                className={clsx(
                  "rounded-2xl border px-5 py-5 backdrop-blur-xl transition-all duration-300",
                  palette.card,
                  palette.cardHover
                )}
              >
                <p
                  className={clsx(
                    "text-xs uppercase tracking-[0.35em]",
                    palette.faint
                  )}
                >
                  Outcome lift
                </p>
                <p className="mt-2 text-2xl font-semibold">+34%</p>
                <p className={clsx("mt-2 text-xs", palette.muted)}>
                  Improved engagement in the first quarter
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            {spotlights.map((spotlight) => {
              const Icon = spotlight.icon;
              return (
                <div
                  key={spotlight.title}
                  className={clsx(
                    "relative overflow-hidden rounded-3xl border p-8 transition-all duration-500",
                    palette.spotlightCard,
                    palette.cardHover
                  )}
                >
                  <div
                    className={clsx(
                      "absolute -bottom-16 -right-12 h-40 w-40 rounded-full blur-3xl transition-colors duration-700",
                      isDark ? "bg-primary-500/20" : "bg-primary-200/40"
                    )}
                  />
                  <div className="relative z-10 flex flex-col gap-4">
                    <div
                      className={clsx(
                        "inline-flex h-12 w-12 items-center justify-center rounded-full border",
                        palette.card
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-2xl font-semibold">
                      {spotlight.title}
                    </h3>
                    <p
                      className={clsx("text-sm leading-relaxed", palette.muted)}
                    >
                      {spotlight.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className={clsx("relative z-10 py-16", palette.marqueeSection)}>
        <div className="container mx-auto px-6">
          <p
            className={clsx(
              "text-center text-xs font-semibold uppercase tracking-[0.45em]",
              palette.faint
            )}
          >
            Trusted by healthcare innovators worldwide
          </p>
        </div>
        <div className="relative mt-6">
          <div className="marquee-container">
            <div className="marquee-content">
              {partnerLogos.map((logoItem, index) => (
                <div key={`logo-primary-${index}`} className="marquee-item">
                  <img
                    src={logoItem}
                    alt={`Partner ${index + 1}`}
                    className={clsx(
                      "h-16 w-auto object-contain transition-all duration-300",
                      palette.marqueeImg
                    )}
                  />
                </div>
              ))}
              {partnerLogos.map((logoItem, index) => (
                <div key={`logo-duplicate-${index}`} className="marquee-item">
                  <img
                    src={logoItem}
                    alt={`Partner ${index + 1}`}
                    className={clsx(
                      "h-16 w-auto object-contain transition-all duration-300",
                      palette.marqueeImg
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-6 py-24">
        <div className="container mx-auto">
          <div
            className={clsx(
              "relative overflow-hidden rounded-3xl border p-12 text-center transition-all duration-500",
              palette.ctaCard
            )}
          >
            <div
              className={clsx(
                "absolute -right-24 top-0 h-72 w-72 rounded-full blur-3xl transition-colors duration-700",
                isDark ? "bg-primary-500/30" : "bg-primary-200/40"
              )}
            />
            <div
              className={clsx(
                "absolute -left-20 bottom-0 h-60 w-60 rounded-full blur-3xl transition-colors duration-700",
                isDark ? "bg-accent-500/25" : "bg-accent-200/35"
              )}
            />
            <div className="relative z-10 space-y-6">
              <span
                className={clsx(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em]",
                  palette.surfaceTag
                )}
              >
                <HeartPulse className="h-4 w-4 text-primary-200" />
                Ready to transform access
              </span>
              <h2 className="text-4xl font-bold leading-tight sm:text-5xl">
                Launch your unified patient and research experience with
                CuraLink.
              </h2>
              <p className={clsx("mx-auto max-w-3xl text-lg", palette.muted)}>
                Schedule a tailored walkthrough with our experience team and
                explore how CuraLink adapts to your organization's needs without
                the complexity.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
                <button
                  onClick={() => navigate("/login")}
                  className={clsx(
                    "btn-primary h-14 rounded-full px-10 text-base tracking-wide transition-transform duration-300",
                    palette.primaryButton
                  )}
                >
                  Request a Demo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
                <button
                  onClick={() => navigate("/researcher/onboarding")}
                  className={clsx(
                    "flex h-14 items-center justify-center rounded-full border px-8 text-base font-semibold transition-all duration-300",
                    palette.secondaryButton
                  )}
                >
                  View Researcher Pathways
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className={clsx("relative z-10 py-10", palette.footer)}>
        <div className="container mx-auto flex flex-col gap-4 px-6 text-center text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} CuraLink. Advancing health access
            together.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="transition-colors duration-300"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/director-management")}
              className="transition-colors duration-300"
            >
              Director Portal
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
