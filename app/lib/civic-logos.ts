export type ProposalSummary = {
  title: string;
  summary: string;
  label: string;
  metric: string;
  href?: string;
};

export type PerspectiveSummary = {
  title: string;
  thesis: string;
  relation: string;
};

export type EvidenceSummary = {
  title: string;
  status: string;
  note: string;
};

export type ClaimAtom = {
  claim: string;
  status: string;
};

export type DebatePrompt = {
  title: string;
  description: string;
};

export type FrameSummary = {
  title: string;
  body: string;
};

export type ScorecardMetric = {
  metric: string;
  rating: string;
};

export type StartHereItem = {
  title: string;
  body: string;
};

export type TopicCardData = {
  id: string;
  title: string;
  subtitle: string;
  draftNote: string;
  thesis: string;
  currentRead: string;
  problemStatement: string;
  proposedSolution: string;
  mechanism: readonly string[];
  benefits: readonly string[];
  risks: readonly string[];
  assumptions: readonly string[];
  stakeholders: readonly string[];
  evidence: readonly EvidenceSummary[];
  economicDelta: {
    summary: string;
    metrics: readonly string[];
  };
  strongestSupport: string;
  strongestObjection: string;
  whatWouldStrengthen: readonly string[];
  openQuestions: readonly string[];
  maturity: string;
  scorecard: readonly {
    label: string;
    value: number;
  }[];
  aiPanels: readonly {
    role: string;
    confidence: string;
    summary: string;
  }[];
  debatePrompts: readonly DebatePrompt[];
  revisionHistory: readonly {
    version: string;
    date: string;
    note: string;
  }[];
};

export type IssueRoomData = {
  title: string;
  question: string;
  deeperQuestion?: string;
  draftNote: string;
  whyItMatters: string;
  currentSynthesis: string;
  narrative: readonly string[];
  workingConclusions: readonly string[];
  whatCouldMoveTheRoom: readonly string[];
  startHere?: readonly StartHereItem[];
  majorFrames?: readonly FrameSummary[];
  initialScorecard?: readonly ScorecardMetric[];
  roomPurpose?: string;
  roomComponents: readonly string[];
  topProposals: readonly ProposalSummary[];
  novelProposals: readonly ProposalSummary[];
  economicDeltaLeaders: readonly ProposalSummary[];
  mostDebated: readonly ProposalSummary[];
  stakeholders: readonly string[];
  perspectives: readonly PerspectiveSummary[];
  evidenceLibrary: readonly EvidenceSummary[];
  objectionLibrary: readonly string[];
  openQuestions: readonly string[];
  claimMap: readonly ClaimAtom[];
};

export type RoomDirectoryItem = {
  slug: string;
  title: string;
  domain: string;
  summary: string;
  complexity: string;
  stage: string;
  href: string;
};

export type LiveCardIndexItem = ProposalSummary & {
  roomHref: string;
  roomStage: string;
  roomTitle: string;
};

export const issueRoomQuestion =
  "What healthcare system best balances cost, access, quality, freedom, innovation, human dignity, public health, and long-term economic sustainability?";

export const healthcareIssueRoom = {
  title: "Healthcare Reform",
  question: issueRoomQuestion,
  deeperQuestion:
    "Which structure produces the most human benefit with the least waste, coercion, corruption, delay, and economic distortion?",
  draftNote:
    "This room is an early working draft. The goal is not to look complete yet, but to make the first public synthesis legible enough that people can improve it.",
  whyItMatters:
    "Healthcare is an ideal first room because it affects nearly everyone and cannot be reduced to one factual answer. It is personal, economic, institutional, moral, and political at the same time, and it forces Civic Logos to hold patients, families, providers, insurers, employers, governments, taxpayers, and future generations in one reasoning object.",
  currentSynthesis:
    "Healthcare reform appears to require balancing cost, access, quality, freedom, innovation, human dignity, public health, provider stability, administrative complexity, patient choice, and political feasibility at the same time. The main topic families differ less in their stated goals than in how they allocate responsibility among government, employers, insurers, providers, and individuals. The largest unresolved questions remain transition cost, administrative savings, rural access, provider reimbursement, pharmaceutical pricing, medical debt, patient choice, and long-term economic delta.",
  narrative: [
    "Healthcare is one of the clearest examples of why public reasoning needs structure. Ordinary healthcare debates often collapse into slogans: healthcare is a human right, markets will fix it, insurance companies are the problem, government is inefficient, prevention will save money, or transparency will solve it. Each claim may contain truth, but none is sufficient alone.",
    "The first job of the room is not to declare a winner. It is to map the issue clearly enough that topic cards, claims, assumptions, stakeholders, incentives, and strongest objections can be held together in one living synthesis instead of dissolving into familiar political reflexes.",
  ],
  workingConclusions: [
    "The central disagreement is not simply whether healthcare should be public or private, but which structure produces the most human benefit with the least waste and distortion.",
    "Healthcare costs are not only medical costs; they also include administrative, billing, insurance, legal, regulatory, and institutional complexity.",
    "Economic delta matters, but only if transition costs, distributional effects, rural access, provider stability, and medical-debt effects are made visible rather than buried in slogans.",
  ],
  whatCouldMoveTheRoom: [
    "A credible pilot or case study showing which healthcare costs are truly removable without weakening care quality or provider resilience.",
    "Better evidence on rural hospitals, provider reimbursement, and how different reform models affect edge-case access.",
    "Sharper modeling of administrative cost removal, medical debt reduction, pharmaceutical funding, and household-level burden shifts.",
  ],
  startHere: [
    {
      title: "Start with administrative waste",
      body: "Separate medical cost from billing, claims, insurance, legal, and regulatory complexity. If the room cannot see where waste actually lives, every reform argument blurs together.",
    },
    {
      title: "Test the employment link",
      body: "Ask whether tying healthcare to employment is a feature, a legacy compromise, or a structural distortion. This line of inquiry affects labor mobility, small businesses, and household security all at once.",
    },
    {
      title: "Pressure the edge cases",
      body: "Rural hospitals, chronic illness, emergency care, and medical debt are where clean theories often break. A serious room should check every model against those realities early.",
    },
  ] satisfies StartHereItem[],
  majorFrames: [
    {
      title: "Human Right Frame",
      body: "Healthcare should be guaranteed because illness, injury, disability, childbirth, aging, and emergencies are not ordinary consumer choices. This frame emphasizes human dignity and universal access.",
    },
    {
      title: "Market Reform Frame",
      body: "Healthcare costs are inflated because patients and employers often cannot see prices, compare value, or exert normal market pressure. This frame emphasizes transparency, competition, and consumer choice.",
    },
    {
      title: "Public Infrastructure Frame",
      body: "Healthcare should be treated like essential public infrastructure because medical insecurity weakens the economy, family stability, workforce productivity, and social trust.",
    },
    {
      title: "Employer-Burden Frame",
      body: "Employer-based insurance may distort wages, burden small businesses, and reduce labor mobility. This frame asks whether healthcare should be separated from employment.",
    },
    {
      title: "Institutional Capture Frame",
      body: "Healthcare may be expensive partly because powerful institutions benefit from complexity, opacity, billing fragmentation, regulatory barriers, and payment systems ordinary people cannot challenge.",
    },
    {
      title: "Innovation Frame",
      body: "Any reform must preserve or improve medical innovation, pharmaceutical development, technology, specialized care, and provider quality while still reducing waste.",
    },
  ] satisfies FrameSummary[],
  initialScorecard: [
    { metric: "Civic Importance", rating: "Extreme" },
    { metric: "Human Impact", rating: "Extreme" },
    { metric: "Economic Delta Potential", rating: "Extreme" },
    { metric: "Institutional Complexity", rating: "Extreme" },
    { metric: "Evidence Burden", rating: "High" },
    { metric: "Review Burden", rating: "High" },
    { metric: "Public Debate Value", rating: "High" },
    { metric: "Implementation Difficulty", rating: "High" },
  ] satisfies ScorecardMetric[],
  roomPurpose:
    "The purpose of this room is not to declare the correct healthcare answer. It is to map the claims, assumptions, stakeholders, incentives, evidence, costs, risks, and strongest objections clearly enough that healthcare becomes more legible through structured ideas, AI review, public debate, scorecards, and a living synthesis map.",
  roomComponents: [
    "Current living synthesis",
    "Major topics",
    "Economic delta models",
    "Stakeholders",
    "Evidence library",
    "Public perspectives",
    "Institutional perspectives",
    "Open questions",
  ],
  topProposals: [
    {
      title: "Administrative Simplification and AI-Assisted Triage",
      summary:
        "A seed topic focused on reducing administrative overhead, standardizing claims flows, and using AI-guided intake to improve access and redirect savings toward care.",
      label: "Topic in focus",
      metric: "Best first demonstration of the topic-card process",
      href: "/healthcare/topic-001",
    },
    {
      title: "Employer-Independent Coverage Transition Model",
      summary:
        "Separates healthcare security from employment by moving toward portable coverage, public exchange pathways, and clearer household-level entitlement.",
      label: "Topic in focus",
      metric: "High structural leverage, major transition complexity",
      href: "/healthcare/topic-002",
    },
    {
      title: "Single-Payer Model",
      summary:
        "Consolidates coverage and financing under a public framework, with potential administrative savings and major transition demands.",
      label: "Core topic",
      metric: "High upside, high transition burden",
    },
  ] satisfies ProposalSummary[],
  novelProposals: [
    {
      title: "Rural Healthcare Stabilization Model",
      summary:
        "Creates a dedicated rural-capacity layer so reform does not improve averages while letting fragile hospitals, emergency access, and provider pipelines collapse.",
      label: "Most novel",
      metric: "High access value, edge-case cost pressure",
      href: "/healthcare/topic-003",
    },
    {
      title: "Decentralized Clinic Model",
      summary:
        "Expands local clinics, low-cost care sites, and lighter-weight service delivery to reduce dependency on high-cost hospital workflows.",
      label: "Most novel",
      metric: "Reframes delivery infrastructure",
    },
    {
      title: "Preventive-Care Centered Model",
      summary:
        "Prioritizes prevention, early intervention, and chronic-condition management even when short-term utilization rises.",
      label: "Most novel",
      metric: "Long-horizon payoff profile",
    },
  ] satisfies ProposalSummary[],
  economicDeltaLeaders: [
    {
      title: "Administrative Simplification and AI-Assisted Triage",
      summary:
        "Possible savings come from lower billing complexity, lower intake friction, and better routing of low-risk cases. Costs center on transition systems and implementation confidence.",
      label: "Highest economic-delta",
      metric: "Low-confidence positive case",
      href: "/healthcare/topic-001",
    },
    {
      title: "Pharmaceutical Pricing Reform Model",
      summary:
        "Targets drug-pricing leverage directly, with uncertain spillovers for innovation incentives and international pricing dynamics.",
      label: "Highest economic-delta",
      metric: "Strong leverage, contested incentives",
    },
  ] satisfies ProposalSummary[],
  mostDebated: [
    {
      title: "Price Transparency and Market Competition Model",
      summary:
        "Claims price visibility can reduce costs, but critics question whether patients can realistically shop under stress or emergency conditions.",
      label: "Most debated",
      metric: "High dispute over real-world behavior",
    },
    {
      title: "Employer-Linked Coverage Preservation",
      summary:
        "Preserves the employment link while trying to stabilize coverage and cost, raising the question of whether the core distortion is being managed or simply retained.",
      label: "Most debated",
      metric: "Politically familiar, structurally contested",
    },
  ] satisfies ProposalSummary[],
  stakeholders: [
    "Patients and families",
    "Doctors and nurses",
    "Hospitals and rural hospitals",
    "Insurers and employers",
    "Federal and state governments",
    "Local clinics",
    "People with chronic illness",
    "Pharmaceutical companies",
    "Taxpayers and medical innovators",
  ],
  perspectives: [
    {
      title: "Patient perspective",
      thesis:
        "Access and debt relief matter more than preserving today's insurance structure if the current structure still leaves people delaying care.",
      relation: "Pushes the synthesis toward access and household-burden weighting.",
    },
    {
      title: "Rural provider perspective",
      thesis:
        "Any reform that lowers reimbursement or centralizes too aggressively can unintentionally collapse fragile rural service capacity.",
      relation: "Raises provider-stability and geographic-access risk.",
    },
    {
      title: "Employer perspective",
      thesis:
        "Employer-based coverage distorts hiring and labor mobility, but employers still fear abrupt transition cost and administrative churn.",
      relation: "Highlights transition cost and incentive design.",
    },
    {
      title: "Public-health perspective",
      thesis:
        "The system should be judged not only by coverage mechanics, but by whether it improves long-run population health and preventive care.",
      relation: "Expands the room beyond financing design alone.",
    },
  ] satisfies PerspectiveSummary[],
  evidenceLibrary: [
    {
      title: "Administrative cost data",
      status: "Strong evidence",
      note: "Used to test whether simplification can materially reduce system overhead.",
    },
    {
      title: "Insurance coverage data",
      status: "Established fact",
      note: "Tracks who remains uninsured or underinsured under current arrangements.",
    },
    {
      title: "Rural hospital data",
      status: "Strong evidence",
      note: "Important for detecting reform models that improve averages while weakening edge-case access.",
    },
    {
      title: "International comparisons",
      status: "Contested evidence",
      note: "Useful, but must be translated carefully because institutional contexts differ.",
    },
  ] satisfies EvidenceSummary[],
  objectionLibrary: [
    "Transition costs could wipe out short-term savings even if steady-state costs improve.",
    "AI-assisted triage may improve routing while still creating bias, liability, or false-confidence problems.",
    "Administrative simplification can lower friction without solving underlying price power in hospitals, insurers, or pharmaceuticals.",
    "Reforms that look efficient at the national level may still weaken patient choice or local provider resilience.",
  ],
  openQuestions: [
    "How much administrative waste can realistically be removed within five years?",
    "What transition cost range is politically and operationally survivable?",
    "How should rural access and provider stability be weighted against pure cost savings?",
    "Which reforms improve household financial security without quietly shifting burdens elsewhere?",
  ],
  claimMap: [
    {
      claim: "Administrative costs are a major contributor to high United States healthcare spending.",
      status: "Active claim atom",
    },
    {
      claim: "Employer-based health insurance reduces labor mobility.",
      status: "Active claim atom",
    },
    {
      claim: "Single-payer healthcare could reduce billing complexity.",
      status: "Contested claim atom",
    },
    {
      claim: "Transition costs could reduce short-term savings from healthcare reform.",
      status: "High-priority objection",
    },
    {
      claim: "Preventive care may reduce long-term costs but can increase short-term utilization.",
      status: "Nuance-bearing claim atom",
    },
  ] satisfies ClaimAtom[],
} satisfies IssueRoomData;

export const governanceIssueRoom = {
  title: "Governance and Legitimacy",
  question:
    "What structures of governance best preserve legitimacy, competence, liberty, accountability, and public trust in a high-complexity society?",
  draftNote:
    "This room is seeded as a heavier institutional room. It is intentionally broader, slower, and more constitutional in character than the healthcare room.",
  whyItMatters:
    "The paper treats governance as one of the core civilizational domains because questions of legitimacy, law, authority, civil liberties, incentives, and institutional design ultimately shape every other room.",
  currentSynthesis:
    "Governance breakdown rarely comes from one failure alone. It usually emerges when legitimacy, competence, accountability, transparency, and local responsiveness drift apart. The strongest unresolved disputes concern centralization versus subsidiarity, expert authority versus democratic control, administrative capacity versus freedom, and how to preserve trust when institutions are both necessary and distrusted.",
  narrative: [
    "A governance room should not collapse into campaign slogans, constitutional nostalgia, or anti-government theater. Its job is to map how authority is structured, where legitimacy is earned or lost, and what institutional designs actually survive contact with complexity.",
    "This room needs to hold law, public administration, civil liberties, corruption risk, and democratic process in one visible frame. If it works, it becomes the place where questions of institutional design can be examined before they harden into factional loyalty.",
  ],
  workingConclusions: [
    "Healthy governance depends on legitimacy and competence together; either one without the other decays.",
    "Administrative systems need enough capacity to act, but enough transparency and constraint to remain publicly accountable.",
    "The deepest disagreements are about where authority should sit and how correction happens when institutions fail.",
  ],
  whatCouldMoveTheRoom: [
    "Concrete comparisons between governance models under real institutional stress, not just abstract constitutional preference.",
    "Better mapping of failure modes in bureaucracies, courts, legislatures, and local governments.",
    "Visible tradeoff analysis on centralization, local control, civil liberties, and emergency powers.",
  ],
  startHere: [
    {
      title: "Map legitimacy versus competence",
      body: "Start by treating legitimacy and competence as separate variables. Many governance fights become clearer once you ask which systems are trusted, which systems work, and where those two drift apart.",
    },
    {
      title: "Stress-test emergency power",
      body: "Use crisis governance as a hard test case. It forces the room to confront speed, centralization, abuse risk, and correction mechanisms all at once.",
    },
    {
      title: "Compare where authority sits",
      body: "Subsidiarity, technocracy, executive coordination, and public review all answer the same question differently: who should decide, and how can they be corrected when they fail?",
    },
  ] satisfies StartHereItem[],
  roomComponents: healthcareIssueRoom.roomComponents,
  topProposals: [
    {
      title: "Subsidiarity-First Governance Model",
      summary:
        "Pushes authority downward wherever possible while preserving a limited central layer for rights protection and coordination.",
      label: "Topic in focus",
      metric: "Strong legitimacy case, uneven capacity risk",
      href: "/rooms/governance/topic-001",
    },
    {
      title: "Technocratic Administrative State Model",
      summary:
        "Relies on professional expertise, institutional continuity, and procedural governance to manage complexity at scale.",
      label: "Core topic",
      metric: "High capacity, trust deficit risk",
    },
    {
      title: "Radical Civic Transparency Model",
      summary:
        "Prioritizes open records, public process visibility, and traceable decision flows as the primary anti-corruption mechanism.",
      label: "Core topic",
      metric: "High sunlight, slower throughput",
    },
  ],
  novelProposals: [
    {
      title: "Metric-Governed Public Review Model",
      summary:
        "Uses explicit public metrics and review layers to discipline institutional claims before formal action is taken.",
      label: "Most novel",
      metric: "Closer to Civic Logos-native governance",
    },
    {
      title: "Sortition and Citizen Panel Hybrid",
      summary:
        "Combines expert process with rotating citizen review bodies to reduce capture and restore legitimacy.",
      label: "Most novel",
      metric: "Legitimacy experiment with scale questions",
      href: "/rooms/governance/topic-002",
    },
  ],
  economicDeltaLeaders: [
    {
      title: "Administrative Simplification for Government Services",
      summary:
        "Focuses on reducing procedural waste, permitting delay, and bureaucratic duplication without collapsing legal safeguards.",
      label: "Highest economic-delta",
      metric: "Potentially large productivity upside",
    },
    {
      title: "Local Autonomy and Fiscal Accountability Model",
      summary:
        "Claims budget clarity and tighter local feedback loops can improve public trust and spending efficiency.",
      label: "Highest economic-delta",
      metric: "Sharper incentives, uneven outcomes",
    },
  ],
  mostDebated: [
    {
      title: "Strong Executive Coordination Model",
      summary:
        "Argues modern states need faster executive coherence, while critics see concentrated abuse risk.",
      label: "Most debated",
      metric: "Capacity versus liberty flashpoint",
    },
    {
      title: "Direct Digital Democracy Layer",
      summary:
        "Promises more public input, but raises concerns about manipulation, volatility, and performative governance.",
      label: "Most debated",
      metric: "High participation, high instability risk",
    },
  ],
  stakeholders: [
    "Citizens and local communities",
    "Courts and legal institutions",
    "Legislatures and executives",
    "Civil servants and regulators",
    "Journalists and watchdogs",
    "Political parties and campaigns",
    "Whistleblowers and dissenters",
    "Future generations",
  ],
  perspectives: [
    {
      title: "Civil-liberties perspective",
      thesis:
        "Institutional capacity matters, but unconstrained emergency powers and opaque administrative systems corrode legitimacy over time.",
      relation: "Raises liberty and anti-abuse constraints.",
    },
    {
      title: "Administrative competence perspective",
      thesis:
        "A state that cannot execute, coordinate, or maintain public systems loses legitimacy regardless of formal democratic theory.",
      relation: "Raises capacity and implementation realism.",
    },
    {
      title: "Localist perspective",
      thesis:
        "Many failures of trust come from decisions being made too far from the communities that live with the consequences.",
      relation: "Raises subsidiarity and local knowledge.",
    },
    {
      title: "Anti-corruption perspective",
      thesis:
        "Governance quality depends less on slogans than on visible incentives, auditability, and conflict-of-interest controls.",
      relation: "Pushes the room toward disclosure and process design.",
    },
  ],
  evidenceLibrary: [
    {
      title: "Institutional trust trend data",
      status: "Strong evidence",
      note: "Useful for tracking legitimacy decay, though it does not identify a single cause by itself.",
    },
    {
      title: "Comparative constitutional and administrative history",
      status: "Contested evidence",
      note: "Important, but difficult to translate cleanly across cultures and time periods.",
    },
    {
      title: "Corruption and transparency indices",
      status: "Useful but incomplete",
      note: "Helpful directional signals, but often too blunt to resolve institutional design questions alone.",
    },
    {
      title: "Case studies of emergency governance",
      status: "Strong evidence",
      note: "Relevant for testing the tradeoff between speed, legitimacy, and abuse risk.",
    },
  ],
  objectionLibrary: [
    "Calls for stronger governance capacity often underestimate abuse risk once power centralizes.",
    "Calls for radical decentralization can romanticize local knowledge while ignoring local capture and uneven competence.",
    "Transparency alone does not fix corruption if incentives remain intact.",
    "Digital participation layers can become new surfaces for manipulation rather than a cure for legitimacy loss.",
  ],
  openQuestions: [
    "What governance structures best combine competence with visible public correction?",
    "How much central coordination is necessary before local autonomy becomes fragile or fictitious?",
    "Which trust metrics actually predict institutional resilience rather than temporary popularity?",
    "How should emergency powers be bounded in a system that still needs to act under pressure?",
  ],
  claimMap: [
    {
      claim: "Legitimacy depends on both competence and accountability rather than on procedure alone.",
      status: "Active claim atom",
    },
    {
      claim: "Institutional opacity increases corruption and trust decay.",
      status: "Active claim atom",
    },
    {
      claim: "More local control usually improves legitimacy.",
      status: "Contested claim atom",
    },
    {
      claim: "Administrative simplification can increase state competence without increasing coercive power.",
      status: "Nuance-bearing claim atom",
    },
    {
      claim: "Emergency authority tends to outlive the emergency that justified it.",
      status: "High-priority objection",
    },
  ],
} satisfies IssueRoomData;

export const housingIssueRoom = {
  title: "Housing and Land Use",
  question:
    "What housing system best balances affordability, stability, neighborhood character, property rights, density, local control, and long-term abundance?",
  draftNote:
    "This room is seeded because housing is one of the clearest examples of a problem that restarts from slogans every few years without building public memory.",
  whyItMatters:
    "The paper explicitly names housing as a major domain because affordability, zoning, land use, construction, infrastructure, local politics, and family stability all converge here.",
  currentSynthesis:
    "Housing scarcity is not caused by one variable. Price pressure reflects land constraints, zoning, permitting delay, financing conditions, infrastructure limits, investor behavior, labor shortages, household formation, and local political incentives. The core unresolved disputes concern how much scarcity is artificial, how much density is necessary, what protections existing residents deserve, and how to increase supply without destroying place-level trust.",
  narrative: [
    "A housing room should preserve the fact that affordability, growth, displacement, aesthetics, local democracy, construction economics, and homelessness are entangled rather than separable.",
    "The room becomes useful when it forces competing housing models to reveal who benefits, who pays, what gets built, and what tradeoffs are being hidden behind moral language.",
  ],
  workingConclusions: [
    "Supply matters, but the room should not reduce the entire issue to one slogan about supply.",
    "Permitting, zoning, infrastructure, financing, and political incentives all shape whether supply can actually arrive.",
    "The most serious disagreements are about pace, place, rights, and who absorbs the transitional pain of change.",
  ],
  whatCouldMoveTheRoom: [
    "Better evidence on where new supply lowers pressure and where it mainly redistributes it.",
    "Comparative case studies on zoning reform, modular construction, and infrastructure-led housing growth.",
    "Sharper stakeholder mapping around tenants, small owners, developers, municipalities, and unhoused populations.",
  ],
  startHere: [
    {
      title: "Separate scarcity from sentiment",
      body: "Start by distinguishing hard physical constraints from policy-created scarcity. Zoning, permitting, infrastructure, and finance each shape prices differently, and the room should keep those drivers visible.",
    },
    {
      title: "Follow who absorbs the change",
      body: "Any housing model should show who benefits, who pays, and who bears the transitional pain. This is where supply arguments, displacement arguments, and local-democracy arguments stop talking past one another.",
    },
    {
      title: "Use one region as a test case",
      body: "Choose a high-cost region and trace what actually blocks abundance: land use, labor, infrastructure, approval delay, or capital structure. Specificity will do more work than abstract housing ideology.",
    },
  ] satisfies StartHereItem[],
  roomComponents: healthcareIssueRoom.roomComponents,
  topProposals: [
    {
      title: "Abundance and Zoning Reform Model",
      summary:
        "Expands by-right construction capacity, legalizes more density, and treats scarcity as a policy choice that must be reversed.",
      label: "Topic in focus",
      metric: "Strong supply logic, contested local politics",
      href: "/rooms/housing/topic-001",
    },
    {
      title: "Public and Social Housing Expansion",
      summary:
        "Uses direct public or nonprofit production to increase affordability where market delivery is too slow or too exclusionary.",
      label: "Core topic",
      metric: "High equity case, heavy delivery challenge",
    },
    {
      title: "Transit-Oriented Growth Model",
      summary:
        "Concentrates new housing around transit and infrastructure corridors to reduce car dependence and unlock regional capacity.",
      label: "Core topic",
      metric: "Strong systems logic, long rollout",
    },
  ],
  novelProposals: [
    {
      title: "Incremental Neighborhood Fabric Model",
      summary:
        "Legalizes small-scale missing-middle growth without treating every neighborhood as a tower district.",
      label: "Most novel",
      metric: "Political bridge strategy",
    },
    {
      title: "Land Value Recapture Model",
      summary:
        "Links upzoning and infrastructure gains to public reinvestment rather than pure private windfall.",
      label: "Most novel",
      metric: "High incentive-design complexity",
      href: "/rooms/housing/topic-002",
    },
  ],
  economicDeltaLeaders: [
    {
      title: "Permitting Compression Model",
      summary:
        "Targets delay, carrying cost, and administrative uncertainty as hidden drivers of housing price escalation.",
      label: "Highest economic-delta",
      metric: "Process reform with broad spillovers",
    },
    {
      title: "Large-Scale Modular and Factory-Built Housing",
      summary:
        "Claims large productivity gains in construction if code, financing, and local approval systems can adapt.",
      label: "Highest economic-delta",
      metric: "Potential cost compression, execution risk",
    },
  ],
  mostDebated: [
    {
      title: "Investor Restriction and Speculation Control",
      summary:
        "Argues capital behavior is a major driver of unaffordability, while critics say supply and regulation matter more.",
      label: "Most debated",
      metric: "Ownership versus scarcity dispute",
    },
    {
      title: "Local Veto Preservation",
      summary:
        "Defends neighborhood control as democratic self-governance, while critics see it as scarcity protection.",
      label: "Most debated",
      metric: "Democracy versus abundance flashpoint",
    },
  ],
  stakeholders: [
    "Renters and first-time buyers",
    "Longtime homeowners",
    "Developers and builders",
    "Cities and planning boards",
    "Transit agencies and utilities",
    "Unhoused residents",
    "Neighborhood groups",
    "Employers and regional economies",
  ],
  perspectives: [
    {
      title: "Tenant perspective",
      thesis:
        "Affordability and housing security matter more than preserving exclusionary local patterns that lock new households out.",
      relation: "Raises access and cost urgency.",
    },
    {
      title: "Homeowner perspective",
      thesis:
        "Neighborhood change should not be framed as costless when residents carry place attachment, savings risk, and infrastructure concerns.",
      relation: "Raises stability and local legitimacy.",
    },
    {
      title: "Builder perspective",
      thesis:
        "Many projects fail long before construction because financing, entitlement delay, and inconsistent rules make delivery too risky.",
      relation: "Raises implementation realism.",
    },
    {
      title: "Municipal perspective",
      thesis:
        "Housing growth without infrastructure, schools, and services can create a political backlash that then freezes future supply.",
      relation: "Raises sequencing and capacity constraints.",
    },
  ],
  evidenceLibrary: [
    {
      title: "Rent burden and household formation data",
      status: "Strong evidence",
      note: "Core for seeing how affordability pressure distorts family formation and economic mobility.",
    },
    {
      title: "Zoning and permitting case studies",
      status: "Strong evidence",
      note: "Important for testing how much supply delay is policy-generated.",
    },
    {
      title: "Construction productivity data",
      status: "Useful but incomplete",
      note: "Helpful for comparing delivery models, though local variance remains large.",
    },
    {
      title: "Displacement and neighborhood change evidence",
      status: "Contested evidence",
      note: "Central to the moral stakes of the room, but often used selectively by both sides.",
    },
  ],
  objectionLibrary: [
    "Pure supply narratives can ignore displacement, financing asymmetry, and the politics of where new housing actually lands.",
    "Public housing expansion can be administratively slow, politically fragile, or poorly maintained without institutional competence.",
    "Local control arguments often protect exclusionary scarcity, but full override models can trigger legitimacy collapse.",
    "Housing reform that ignores infrastructure can simply relocate congestion and resentment rather than solve scarcity.",
  ],
  openQuestions: [
    "Which housing bottlenecks are most binding in high-cost regions: land use, finance, labor, or politics?",
    "How much supply needs to arrive before households actually feel price relief?",
    "What anti-displacement protections can coexist with genuine abundance?",
    "How should local democratic control be weighed against regional affordability needs?",
  ],
  claimMap: [
    {
      claim: "Artificial scarcity from zoning and permitting is a major driver of housing cost.",
      status: "Active claim atom",
    },
    {
      claim: "More supply will eventually lower overall housing pressure.",
      status: "Active claim atom",
    },
    {
      claim: "Local veto power is necessary for democratic legitimacy.",
      status: "Contested claim atom",
    },
    {
      claim: "Transit-oriented growth creates higher long-run regional efficiency.",
      status: "Nuance-bearing claim atom",
    },
    {
      claim: "New market-rate housing reliably protects existing low-income residents from displacement.",
      status: "High-priority objection",
    },
  ],
} satisfies IssueRoomData;

export const aiLaborIssueRoom = {
  title: "AI and Civilizational Impact",
  question:
    "Will artificial intelligence produce more good than harm for humanity, the Earth, and global civilization as a whole?",
  deeperQuestion:
    "Who controls AI, what incentives guide it, what human capacities does it strengthen or weaken, and does it move civilization toward greater truth, freedom, sustainability, and intelligence, or toward manipulation, dependency, and centralized power?",
  draftNote:
    "This room is intentionally broad. It is meant to hold the full dispute about AI's long-run civilizational effects before the argument gets reduced to one narrow frame like jobs, alignment, or product hype.",
  whyItMatters:
    "Artificial intelligence is not only a technology issue. It is a civilizational issue. AI may reshape labor, education, medicine, science, design, governance, war, media, creativity, economics, public reasoning, and the relationship between humans and knowledge.",
  currentSynthesis:
    "AI appears to be a force multiplier rather than a simple good or bad object. Its overall effect will depend on ownership, incentives, governance, alignment, access, use, and the degree to which it strengthens or weakens human intelligence. The largest unresolved questions concern concentration of power, labor displacement, propaganda, surveillance, military automation, scientific acceleration, dependency, and what forms of governance can keep the upside while containing the downside.",
  narrative: [
    "AI has extraordinary upside and extraordinary downside. It can help cure disease, accelerate scientific discovery, improve education, reduce administrative waste, expand creativity, and help people reason through complex problems. It can also intensify surveillance, propaganda, unemployment, institutional capture, dependency, inequality, military automation, and loss of human agency.",
    "AI is also uniquely relevant to Civic Logos because AI is both the subject of the issue and part of the method used to examine the issue. This room asks whether AI can help humans reason about whether AI is good or bad overall.",
  ],
  workingConclusions: [
    "AI is a force multiplier rather than a simple good or bad object.",
    "The upside could be extraordinary, but it will not distribute itself automatically or safely.",
    "The central question is not whether AI is powerful, but whether ownership, incentives, governance, alignment, and use make it net beneficial rather than net harmful.",
  ],
  whatCouldMoveTheRoom: [
    "Better evidence on whether AI improves public reasoning more than it improves propaganda and manipulation.",
    "Sharper comparisons between open, corporate, and state-controlled AI futures.",
    "More serious synthesis on labor, surveillance, military use, education, governance, and scientific acceleration in one shared frame.",
  ],
  startHere: [
    {
      title: "Start with ownership and control",
      body: "Before arguing about whether AI is good or bad overall, ask who owns the systems, who sets the incentives, and who gets the upside. That usually clarifies half the room immediately.",
    },
    {
      title: "Split productivity from distribution",
      body: "The room should keep separate the question of whether AI creates value from the question of who captures it. Civilizational benefit depends on both.",
    },
    {
      title: "Use truth and agency as hard tests",
      body: "A strong AI future should improve human reasoning, not just automate output. Propaganda, dependence, and loss of human agency are the right pressure points to test early.",
    },
  ] satisfies StartHereItem[],
  majorFrames: [
    {
      title: "Acceleration / Progress Frame",
      body: "AI is a tool for discovery, productivity, medicine, science, education, engineering, and problem-solving. This frame emphasizes accelerated human progress.",
    },
    {
      title: "Labor Displacement Frame",
      body: "AI may replace or devalue human labor faster than society can adapt. This frame asks who benefits from productivity gains and what happens to displaced workers.",
    },
    {
      title: "Institutional Capture Frame",
      body: "AI may concentrate power in governments, corporations, militaries, intelligence agencies, and data-rich institutions. This frame asks whether AI strengthens freedom or invisible control.",
    },
    {
      title: "Human Flourishing Frame",
      body: "AI could free people from repetitive work, expand learning, improve medicine, support creativity, and help individuals better understand themselves and the world.",
    },
    {
      title: "Dependency / Dehumanization Frame",
      body: "AI may weaken human judgment, memory, creativity, social bonds, responsibility, and direct experience. This frame asks whether AI makes humans more capable or more dependent.",
    },
    {
      title: "Truth / Propaganda Frame",
      body: "AI can clarify information, but it can also flood the world with synthetic persuasion, deepfakes, spam, fake consensus, and personalized manipulation.",
    },
    {
      title: "Civilization Upgrade Frame",
      body: "AI could become a reasoning layer that helps civilization coordinate, solve problems, and think more clearly in public. This is the frame where Civic Logos itself belongs.",
    },
    {
      title: "Existential Risk Frame",
      body: "Advanced AI could become uncontrollable, misaligned, weaponized, or systemically destabilizing. This frame examines catastrophic failure and loss of human control.",
    },
  ] satisfies FrameSummary[],
  initialScorecard: [
    { metric: "Civic Importance", rating: "Extreme" },
    { metric: "Economic Delta Potential", rating: "Extreme" },
    { metric: "Human Benefit Potential", rating: "Extreme" },
    { metric: "Harm Potential", rating: "Extreme" },
    { metric: "Institutional Capture Risk", rating: "Extreme" },
    { metric: "Uncertainty", rating: "High" },
    { metric: "Review Burden", rating: "Extreme" },
    { metric: "Public Debate Value", rating: "Extreme" },
  ] satisfies ScorecardMetric[],
  roomPurpose:
    "The purpose of this room is to evaluate AI not merely by what it can do, but by what it does to human beings, institutions, truth, labor, freedom, and the Earth. AI is not automatically good or bad. It becomes good or bad through ownership, incentives, governance, alignment, use, and the degree to which it strengthens or weakens human intelligence.",
  roomComponents: healthcareIssueRoom.roomComponents,
  topProposals: [
    {
      title: "AI as Public Reasoning Infrastructure",
      summary:
        "Treats AI as a public reasoning layer that helps map claims, objections, evidence, and revisions in the open rather than optimizing persuasion or opaque authority.",
      label: "Topic in focus",
      metric: "Most native Civic Logos test case",
      href: "/rooms/ai-labor/topic-001",
    },
    {
      title: "Synthetic Media Verification and Anti-Propaganda Layer",
      summary:
        "Builds provenance, verification, challenge, and public-trust infrastructure so AI does not dissolve shared reality before its productive upside arrives.",
      label: "Topic in focus",
      metric: "Truth-preserving rather than productivity-first",
      href: "/rooms/ai-labor/topic-002",
    },
    {
      title: "Strong Public-Governance and Safety Model",
      summary:
        "Places frontier AI behind tighter institutional oversight, safety testing, and public-interest constraints before broad deployment.",
      label: "Core topic",
      metric: "Lower downside ambition, slower innovation",
    },
    {
      title: "Accelerationist Competitive Model",
      summary:
        "Assumes rapid deployment and open competition produce the largest total benefit, and that society should adapt around fast capability growth.",
      label: "Core topic",
      metric: "High upside, high systemic risk",
    },
  ],
  novelProposals: [
    {
      title: "AI Commons Infrastructure Model",
      summary:
        "Argues core AI capacity should become a partially public or commons-like layer rather than remain purely corporate or state concentrated.",
      label: "Most novel",
      metric: "Institutional redesign at the infrastructure layer",
    },
    {
      title: "Human Dignity and Role Preservation Model",
      summary:
        "Explores whether societies should intentionally preserve meaningful human roles even when pure optimization argues for deeper automation.",
      label: "Most novel",
      metric: "Meaning-centered rather than efficiency-centered",
    },
  ],
  economicDeltaLeaders: [
    {
      title: "AI-Augmented Scientific and Professional Workflows",
      summary:
        "Focuses on large productivity and discovery gains in medicine, research, law, logistics, and government.",
      label: "Highest economic-delta",
      metric: "Massive upside if the benefits remain broad",
    },
    {
      title: "Automation Dividend Redistribution",
      summary:
        "Attempts to link broad welfare gains to concentrated productivity gains so the AI upside does not collapse into narrow ownership.",
      label: "Highest economic-delta",
      metric: "Distribution is the whole test",
    },
  ],
  mostDebated: [
    {
      title: "Existential-Risk and Loss-of-Control Scenario",
      summary:
        "Claims advanced AI could create catastrophic control or alignment failures, while critics see these fears as overstated or too speculative to dominate governance.",
      label: "Most debated",
      metric: "Catastrophic risk dispute",
    },
    {
      title: "AI Will Mostly Be Net Positive",
      summary:
        "Argues that despite dislocation and misuse risks, the total long-run effect of AI on health, knowledge, productivity, and quality of life will be strongly positive.",
      label: "Most debated",
      metric: "Optimism versus systemic caution",
    },
  ],
  stakeholders: [
    "Workers across income bands",
    "Students and training systems",
    "Employers and AI firms",
    "Investors and capital owners",
    "Governments and tax systems",
    "Researchers and scientists",
    "Military and security institutions",
    "Civil-liberties advocates",
    "Caregivers and families",
    "Future generations",
  ],
  perspectives: [
    {
      title: "Worker perspective",
      thesis:
        "People fear not only losing income, but losing leverage, identity, and a credible place in the social order.",
      relation: "Raises bargaining power and dignity.",
    },
    {
      title: "Builder perspective",
      thesis:
        "AI can unlock enormous productivity gains, but hostile or panicked policy could slow beneficial adoption.",
      relation: "Raises innovation and growth pressure.",
    },
    {
      title: "Safety perspective",
      thesis:
        "A civilization does not get to enjoy AI upside if it loses control of the systems or creates irreversible concentration and misuse first.",
      relation: "Raises catastrophic and governance constraints.",
    },
    {
      title: "Civic-humanist perspective",
      thesis:
        "Even highly beneficial AI could still be socially damaging if it weakens human agency, responsibility, and the structures that give life meaning.",
      relation: "Expands the room beyond capability and GDP alone.",
    },
  ],
  evidenceLibrary: [
    {
      title: "Task exposure and occupational vulnerability studies",
      status: "Strong evidence",
      note: "Useful for identifying where labor displacement or task compression may appear first.",
    },
    {
      title: "Frontier capability and benchmark progression",
      status: "Useful but incomplete",
      note: "Important for understanding how quickly systems are improving, though benchmark gains do not map cleanly to civilizational benefit.",
    },
    {
      title: "Firm-level productivity and scientific-use case studies",
      status: "Strong evidence",
      note: "Necessary for tracking whether real-world upside is material or mostly hype.",
    },
    {
      title: "Safety, misuse, and deception incidents",
      status: "Contested evidence",
      note: "Central to the downside case, but still early and difficult to extrapolate from cleanly.",
    },
  ],
  objectionLibrary: [
    "Productivity gains may concentrate in a small number of firms, states, or capital owners long before broad public benefit appears.",
    "A civilization can be made more efficient while becoming less free, less stable, or less humanly meaningful.",
    "Safety and alignment language can be used sincerely, but also as a political tool for incumbent control.",
    "Even if AI is net positive overall, transition shocks in labor, politics, and information quality may still be severe enough to destabilize society.",
  ],
  openQuestions: [
    "What would count as strong evidence that AI is net positive overall rather than merely lucrative or impressive?",
    "Which risks are most likely to dominate first: labor displacement, surveillance, military escalation, epistemic corruption, or loss-of-control failure?",
    "How should AI gains be governed if present ownership structures are too concentrated?",
    "What human roles, rights, and institutions should remain protected even in a world of extraordinary machine capability?",
  ],
  claimMap: [
    {
      claim: "AI's overall effect will depend more on governance and ownership than on raw capability alone.",
      status: "Active claim atom",
    },
    {
      claim: "Productivity gains will not be broadly shared without institutional intervention.",
      status: "Active claim atom",
    },
    {
      claim: "AI is likely to be net positive overall if institutions adapt well enough.",
      status: "Contested claim atom",
    },
    {
      claim: "AI could accelerate science and public problem-solving faster than it destabilizes social order.",
      status: "Nuance-bearing claim atom",
    },
    {
      claim: "AI risk is overstated relative to the upside and should not meaningfully slow deployment.",
      status: "High-priority objection",
    },
  ],
} satisfies IssueRoomData;

export const institutionalTrustIssueRoom = {
  title: "Institutional Trust and Corruption",
  question:
    "How should a society diagnose and reduce corruption, capture, propaganda, and trust decay across major institutions without collapsing into paranoia or nihilism?",
  draftNote:
    "This room is seeded as a trust room rather than a scandal room. The point is to study incentive structure, legitimacy decay, and repair mechanisms, not to become a feed of accusations.",
  whyItMatters:
    "The paper returns repeatedly to institutional capture, disclosure, reputation laundering, astroturfing, and the need for labeled institutional speech. This room sits close to the heart of the Civic Logos thesis.",
  currentSynthesis:
    "Trust decays when institutions become opaque, self-protective, misaligned, or obviously insulated from consequences. But distrust can also be manufactured, monetized, and inflated beyond reality. The unresolved challenge is how to distinguish legitimate institutional criticism from corrosive blanket cynicism while still forcing powerful actors into transparency and review.",
  narrative: [
    "This room should help the public reason about corruption and trust decay without becoming a conspiracy arena. That means forcing accusations, incentives, evidence, and institutional responses into structured objects rather than outrage cycles.",
    "It also needs to examine how trust can be rebuilt: through disclosure, auditability, conflict-of-interest controls, correction rituals, and visible institutional memory.",
  ],
  workingConclusions: [
    "Trust usually breaks through repeated misalignment, opacity, and non-correction rather than through one dramatic event alone.",
    "Anti-corruption design must address incentives and information flows, not just individual bad actors.",
    "A room like this only works if it can hold skepticism without rewarding paranoia.",
  ],
  whatCouldMoveTheRoom: [
    "Better institutional disclosure models that are legible to ordinary readers rather than only specialists.",
    "Comparative evidence on what anti-corruption mechanisms actually improve trust over time.",
    "Stronger distinctions between institutional error, capture, propaganda, and ordinary disagreement.",
  ],
  startHere: [
    {
      title: "Start with misalignment, not scandal",
      body: "The room works best when it treats trust decay as an incentive and correction problem, not just a gallery of bad events. That keeps the analysis structural instead of purely accusatory.",
    },
    {
      title: "Label the interests behind the speech",
      body: "One of the clearest Civic Logos ideas is that institutional speech should be visibly tied to incentives, funding, and affiliations. This is one of the first lines of inquiry the room should keep live.",
    },
    {
      title: "Separate skepticism from nihilism",
      body: "A healthy trust room should distinguish justified distrust from blanket collapse of trust. If it cannot, it will either become naive or conspiratorial.",
    },
  ] satisfies StartHereItem[],
  roomComponents: healthcareIssueRoom.roomComponents,
  topProposals: [
    {
      title: "Radical Disclosure and Conflict Mapping Model",
      summary:
        "Requires visible institutional incentives, affiliations, funding, and correction history as first-order public objects.",
      label: "Topic in focus",
      metric: "Strong transparency logic",
      href: "/rooms/institutional-trust/topic-002",
    },
    {
      title: "Independent Public Audit Layer",
      summary:
        "Creates a standing review process for major institutional claims, corrections, and contested public narratives.",
      label: "Core topic",
      metric: "High accountability potential, expensive to run",
    },
    {
      title: "Domain-Specific Trust and Reputation Model",
      summary:
        "Prevents institutions from laundering trust earned in one domain into another where conflicts of interest differ.",
      label: "Core topic",
      metric: "Very aligned with Civic Logos architecture",
    },
  ],
  novelProposals: [
    {
      title: "Public Correction Ledger Model",
      summary:
        "Treats corrections, reversals, and admissions as durable institutional memory instead of PR cleanup.",
      label: "Most novel",
      metric: "Memory-first accountability",
    },
    {
      title: "Astroturf Detection and Labeling Layer",
      summary:
        "Surfaces coordinated influence, manufactured consensus, and hidden institutional speech as a structural moderation problem.",
      label: "Most novel",
      metric: "High relevance, difficult implementation",
    },
  ],
  economicDeltaLeaders: [
    {
      title: "Procurement and Contract Transparency Model",
      summary:
        "Targets waste, favoritism, and public distrust through visible spending pathways and auditability.",
      label: "Highest economic-delta",
      metric: "Clear fiscal upside if adopted",
    },
    {
      title: "Public Review Stake for Institutional Claims",
      summary:
        "Forces high-impact institutional claims to pay for structured examination without buying favorable outcomes.",
      label: "Highest economic-delta",
      metric: "Trust and revenue architecture overlap",
      href: "/rooms/institutional-trust/topic-001",
    },
  ],
  mostDebated: [
    {
      title: "Everything Is Capture Model",
      summary:
        "Claims most institutions are already irredeemably compromised, while critics see this as politically intoxicating but socially destructive.",
      label: "Most debated",
      metric: "Truth-seeking versus nihilism fault line",
    },
    {
      title: "Trust the Credentialed Class Model",
      summary:
        "Argues legitimacy should track expertise and institutional continuity, while critics see unaccountable insulation.",
      label: "Most debated",
      metric: "Expertise versus public distrust fault line",
    },
  ],
  stakeholders: [
    "Citizens and readers",
    "Journalists and researchers",
    "Government agencies",
    "Corporations and lobbying groups",
    "Universities and nonprofits",
    "Whistleblowers and insiders",
    "Courts and oversight bodies",
    "Communities under institutional pressure",
  ],
  perspectives: [
    {
      title: "Institutional reform perspective",
      thesis:
        "Most institutions need repair and exposure, not total delegitimation.",
      relation: "Keeps the room in a reform frame.",
    },
    {
      title: "Populist distrust perspective",
      thesis:
        "Institutions repeatedly protect themselves first, so high skepticism is a rational baseline rather than a pathology.",
      relation: "Raises legitimacy and accountability pressure.",
    },
    {
      title: "Professional expertise perspective",
      thesis:
        "Blanket distrust destroys the capacity of institutions that societies still need to function under stress.",
      relation: "Raises competence and anti-nihilism concerns.",
    },
    {
      title: "Whistleblower perspective",
      thesis:
        "Trust repair is impossible if insiders cannot surface real corruption safely and credibly.",
      relation: "Raises anonymity, verification, and retaliation design.",
    },
  ],
  evidenceLibrary: [
    {
      title: "Institutional trust trend surveys",
      status: "Strong evidence",
      note: "Useful for mapping decay, though not sufficient for causal explanation.",
    },
    {
      title: "Conflict-of-interest and funding disclosures",
      status: "Strong evidence",
      note: "Core to identifying where speech, incentives, and authority misalign.",
    },
    {
      title: "Whistleblower case studies",
      status: "Useful but sensitive",
      note: "Important for understanding retaliation and truth-surfacing failure modes.",
    },
    {
      title: "Propaganda and coordinated influence analyses",
      status: "Contested evidence",
      note: "Highly relevant, but also vulnerable to misuse and over-interpretation.",
    },
  ],
  objectionLibrary: [
    "Trust repair efforts can become aesthetics of accountability without changing incentives.",
    "Strong anti-corruption language is often used selectively against opponents while ignoring allied capture.",
    "Too much ambient suspicion can destroy the very institutions that need reform rather than replacement.",
    "Disclosure is necessary but insufficient if the public lacks a structure for interpreting disclosed conflicts.",
  ],
  openQuestions: [
    "What distinctions best separate corruption, ordinary error, ideological bias, and institutional inertia?",
    "Which transparency measures genuinely improve trust instead of merely increasing information overload?",
    "How should whistleblower claims be handled when the evidence is partial but the stakes are high?",
    "What role should domain-specific reputation play in preventing institutional trust laundering?",
  ],
  claimMap: [
    {
      claim: "Trust decays when institutions fail to correct publicly visible errors.",
      status: "Active claim atom",
    },
    {
      claim: "Institutional speech should always be labeled with interests and affiliations.",
      status: "Active claim atom",
    },
    {
      claim: "Low public trust usually reflects institutional failure rather than manufactured distrust.",
      status: "Contested claim atom",
    },
    {
      claim: "Domain-specific reputation reduces institutional laundering across unrelated issues.",
      status: "Nuance-bearing claim atom",
    },
    {
      claim: "High skepticism is the safest default posture toward institutions.",
      status: "High-priority objection",
    },
  ],
} satisfies IssueRoomData;

export const issueRooms = {
  healthcare: healthcareIssueRoom,
  governance: governanceIssueRoom,
  housing: housingIssueRoom,
  "ai-labor": aiLaborIssueRoom,
  "institutional-trust": institutionalTrustIssueRoom,
} satisfies Record<string, IssueRoomData>;

export type IssueRoomSlug = keyof typeof issueRooms;

export function getInspectableTopics(room: IssueRoomData): ProposalSummary[] {
  const seen = new Set<string>();
  const inspectableTopics: ProposalSummary[] = [];

  for (const list of [
    room.topProposals,
    room.novelProposals,
    room.economicDeltaLeaders,
    room.mostDebated,
  ]) {
    for (const item of list) {
      if (!item.href || seen.has(item.href)) {
        continue;
      }

      seen.add(item.href);
      inspectableTopics.push(item);
    }
  }

  return inspectableTopics;
}

export function getLiveCardIndex(): readonly LiveCardIndexItem[] {
  return roomDirectory.flatMap((room) => {
    const roomData = issueRooms[room.slug as IssueRoomSlug];
    const inspectableTopics = getInspectableTopics(roomData);

    return inspectableTopics.map((card) => ({
      ...card,
      roomHref: room.href,
      roomStage: room.stage,
      roomTitle: room.title,
    }));
  });
}

export const roomDirectory: readonly RoomDirectoryItem[] = [
  {
    slug: "healthcare",
    title: healthcareIssueRoom.title,
    domain: "Health and public systems",
    summary:
      "The first full room, useful as a prototype for topics, objections, evidence, and economic-delta thinking.",
    complexity: "High, but still relatively intuitive",
    stage: "Most developed",
    href: "/healthcare",
  },
  {
    slug: "governance",
    title: governanceIssueRoom.title,
    domain: "Political order and institutions",
    summary:
      "A heavier room about legitimacy, competence, public trust, authority, civil liberties, and institutional design.",
    complexity: "Very high",
    stage: "Seeded draft",
    href: "/rooms/governance",
  },
  {
    slug: "housing",
    title: housingIssueRoom.title,
    domain: "Built environment and local politics",
    summary:
      "A room about affordability, land use, density, property rights, neighborhood stability, and long-run abundance.",
    complexity: "Very high",
    stage: "Seeded draft",
    href: "/rooms/housing",
  },
  {
    slug: "ai-labor",
    title: aiLaborIssueRoom.title,
    domain: "Artificial intelligence and civilizational risk",
    summary:
      "A room about whether AI is net good or net bad overall, with labor, safety, power, surveillance, science, and human purpose all inside the same frame.",
    complexity: "Extreme",
    stage: "Seeded draft",
    href: "/rooms/ai-labor",
  },
  {
    slug: "institutional-trust",
    title: institutionalTrustIssueRoom.title,
    domain: "Trust, corruption, and disclosure",
    summary:
      "A room for institutional capture, legitimacy decay, transparency, propaganda, whistleblowing, and repair mechanisms.",
    complexity: "Extreme",
    stage: "Seeded draft",
    href: "/rooms/institutional-trust",
  },
] as const;

export const topic001: TopicCardData = {
  id: "topic-001",
  title: "Administrative Simplification and AI-Assisted Triage",
  subtitle: "An initial healthcare reform topic card submitted for public reasoning",
  draftNote:
    "This topic card is intentionally unfinished. It is meant to demonstrate how one room topic becomes inspectable, criticizable, and revisable in public before the evidence picture is complete.",
  thesis:
    "The United States can reduce healthcare cost and access friction by standardizing administrative flows, using AI-assisted intake and triage for low-risk routing, and reinvesting verified savings into primary and preventive care.",
  currentRead:
    "This topic card feels strongest as a first prototype because it targets real friction without requiring the room to settle the entire healthcare ideology war in one move. It feels weakest wherever advocates implicitly assume that administrative savings will be large, durable, and easy to redirect. The card is useful right now because both of those things can be made explicit.",
  problemStatement:
    "Healthcare spending remains high while patients, providers, and employers still face coverage gaps, billing complexity, administrative delay, and inconsistent access. Even before major financing debates are settled, a large amount of waste appears to come from fragmented claims systems, repetitive intake work, prior-authorization friction, and poor routing of low-complexity cases.",
  proposedSolution:
    "Start with a national administrative simplification layer: common claims formats, interoperable intake, shared documentation standards, and AI-assisted triage for routine routing. Use the resulting savings and workflow gains to improve primary care access and reduce medical debt pressure rather than treating the change as a pure cost-cutting exercise.",
  mechanism: [
    "Standardize claims, coding, intake, and prior-authorization workflows across major payers and providers.",
    "Deploy AI-assisted intake and triage to route low-risk cases, documentation, and scheduling faster while keeping human escalation for uncertain or high-risk situations.",
    "Measure administrative savings, transition costs, and patient-routing outcomes transparently rather than assuming the gains.",
    "Redirect a portion of verified savings toward primary care capacity, preventive care, and debt-reduction pressure points.",
  ],
  benefits: [
    "Patients: faster intake, lower paperwork burden, and clearer care navigation.",
    "Providers: less repetitive administrative work and better throughput for low-complexity cases.",
    "Employers and payers: lower processing friction and better visibility into avoidable overhead.",
    "Public system: a narrower, testable reform path that can clarify what savings are real before larger structural shifts.",
  ],
  risks: [
    "AI-assisted triage could create safety, bias, or liability failures if guardrails are weak.",
    "Transition systems may be expensive and politically fragile before savings are realized.",
    "Administrative simplification may be real but smaller than advocates expect.",
    "The reform could optimize paperwork while leaving deeper price-power problems insufficiently addressed.",
  ],
  assumptions: [
    "Administrative savings will exceed transition costs within a reasonable time horizon.",
    "Public agencies, insurers, and providers can implement common standards competently.",
    "Patients and clinicians will trust AI-guided intake only if escalation paths remain strong.",
    "Workflow simplification can free up meaningful care capacity rather than just shifting burden elsewhere.",
  ],
  stakeholders: [
    "Patients and families",
    "Doctors, nurses, and administrative staff",
    "Hospitals and local clinics",
    "Insurers and claims processors",
    "Employers",
    "Federal and state health agencies",
    "Rural providers",
    "AI vendors and health IT providers",
  ],
  evidence: [
    {
      title: "Administrative overhead appears materially significant",
      status: "Strong evidence",
      note: "Supports the idea that simplification is worth testing as a reform lever.",
    },
    {
      title: "Care navigation and scheduling friction create real patient delay",
      status: "Strong evidence",
      note: "Supports triage and intake redesign as an access problem, not just a back-office problem.",
    },
    {
      title: "AI routing can improve throughput in narrow workflows",
      status: "Contested evidence",
      note: "Suggestive, but still sensitive to bias, workflow quality, and domain limits.",
    },
    {
      title: "Savings from simplification will automatically translate into lower total cost",
      status: "Needs verification",
      note: "This is plausible but should not be assumed without a visible transition model.",
    },
  ] satisfies EvidenceSummary[],
  economicDelta: {
    summary:
      "Estimated Economic Delta: Unknown; preliminary range to be developed. Main possible savings include administrative simplification, lower processing delay, and better routing of routine cases. Main possible costs include transition systems, implementation complexity, model oversight, and reimbursement friction. Confidence remains low until assumptions are quantified.",
    metrics: [
      "Possible annual savings: materially positive if administrative reductions are real",
      "Implementation cost: front-loaded and likely significant",
      "Transition cost: high uncertainty",
      "Household impact: potentially positive through lower friction and debt pressure",
      "Provider impact: mixed until workflow burden and reimbursement effects are clearer",
    ],
  },
  strongestSupport:
    "This topic is a credible first test because it targets a widely acknowledged source of waste without requiring the platform to pretend that one financing ideology has already won the healthcare debate.",
  strongestObjection:
    "The topic risks mistaking administrative optimization for system reform; if pricing power, reimbursement dynamics, and uneven provider capacity remain intact, the savings may disappoint while the implementation burden still lands.",
  whatWouldStrengthen: [
    "A visible pilot design with a bounded scope, success criteria, and transition-cost assumptions.",
    "Better evidence about where intake automation meaningfully helps and where human escalation must remain primary.",
    "A clearer account of how verified savings would be measured and redirected rather than absorbed elsewhere in the system.",
  ],
  openQuestions: [
    "What is the smallest pilot that could test administrative simplification credibly?",
    "How should patient-safety thresholds be set for AI-assisted triage and escalation?",
    "How much of any realized savings should be redirected to primary and preventive care?",
    "What evidence would distinguish real structural savings from shifted accounting burden?",
  ],
  maturity: "Seed topic",
  scorecard: [
    { label: "Novelty", value: 58 },
    { label: "Coherence", value: 78 },
    { label: "Feasibility", value: 62 },
    { label: "Evidence quality", value: 54 },
    { label: "Economic delta clarity", value: 41 },
    { label: "Public value", value: 76 },
  ],
  aiPanels: [
    {
      role: "Structurer",
      confidence: "Moderate",
      summary:
        "Converted a broad reform instinct into a testable object: problem, mechanism, assumptions, savings hypothesis, and risk surface are now explicit.",
    },
    {
      role: "Steelman",
      confidence: "Moderate",
      summary:
        "The strongest case is that the topic attacks real waste, improves access friction, and gives the healthcare room a measurable first demonstration without forcing premature ideological closure.",
    },
    {
      role: "Critic",
      confidence: "Moderate",
      summary:
        "The strongest critique is that this may streamline bureaucracy without confronting deeper price formation, incentive distortion, and uneven care capacity.",
    },
    {
      role: "Economist",
      confidence: "Low",
      summary:
        "Possible upside exists, but the core uncertainty remains whether savings are large enough and durable enough to justify transition and oversight cost.",
    },
  ],
  debatePrompts: [
    {
      title: "Support",
      description: "Add the best argument for why this topic might work better than existing structures.",
    },
    {
      title: "Objection",
      description: "Surface the strongest reason this topic could fail or misfire.",
    },
    {
      title: "Evidence",
      description: "Add supporting or challenging data, case studies, or implementation examples.",
    },
    {
      title: "Correction",
      description: "Identify factual, numeric, definitional, or citation errors in the current card.",
    },
    {
      title: "Nuance",
      description: "Improve the topic by exposing a missing condition or tradeoff without fully rejecting it.",
    },
    {
      title: "Implementation concern",
      description: "Identify the practical barrier between theory and reality.",
    },
    {
      title: "Economic assumption challenge",
      description: "Question whether projected savings, costs, or incentives are being handled honestly.",
    },
    {
      title: "Alternate topic",
      description: "Offer a structurally different route that solves the same problem better.",
    },
    {
      title: "Personal perspective",
      description: "Add lived experience that reveals a blind spot in the current synthesis.",
    },
  ] satisfies DebatePrompt[],
  revisionHistory: [
    {
      version: "v0.1",
      date: "May 2026",
      note: "Initial seed topic card created to demonstrate the full Idea Card anatomy inside the healthcare room.",
    },
    {
      version: "v0.2",
      date: "May 2026",
      note: "Transition cost and provider-stability risks were raised to first-order visibility in the current synthesis.",
    },
    {
      version: "v0.3",
      date: "May 2026",
      note: "Economic delta section marked explicitly low-confidence pending real cost and implementation assumptions.",
    },
  ],
};

export const topic002: TopicCardData = {
  id: "topic-002",
  title: "Employer-Independent Coverage Transition Model",
  subtitle:
    "A second healthcare topic card for testing whether medical security should be separated from employment",
  draftNote:
    "This topic card is intentionally unfinished because it touches one of the deepest structural choices in the healthcare room. It is not trying to settle the whole public-versus-private argument; it is trying to make one question explicit: should access to medical security depend so heavily on where and whether a person works?",
  thesis:
    "Healthcare security should become more portable and less tied to employment, using public exchange pathways, predictable household-level coverage rules, and a staged transition away from job-linked medical dependence.",
  currentRead:
    "This topic card feels strong because it targets a real distortion in the current system: labor mobility, household security, and employer burden are all bent around the employment link. It feels weak wherever advocates imply that portability alone solves cost, provider reimbursement, or rural access. The card is useful because it isolates one structural choice without pretending that every downstream problem disappears with it.",
  problemStatement:
    "Employer-based coverage often ties medical security to job status, which can distort compensation, reduce worker mobility, burden small businesses, and create coverage instability during layoffs, career changes, family transitions, or periods of illness. It also makes healthcare reform harder to reason about because wages, benefits, tax treatment, and labor-market incentives are braided into the insurance structure itself.",
  proposedSolution:
    "Build a staged transition toward employer-independent coverage: preserve continuity during the shift, give households clearer access to portable plans or public exchange pathways, reduce the administrative role of employers over time, and make the cost of healthcare more visible at the household and public-system level instead of hiding it inside employment status.",
  mechanism: [
    "Create portable coverage pathways that do not disappear when employment changes, including public exchange, pooled-plan, or baseline entitlement options.",
    "Shift employer spending and tax treatment gradually so compensation, contribution, and transition burdens are visible rather than abruptly broken.",
    "Protect continuity of care during job changes, layoffs, or family transitions so portability is real in practice and not just formal on paper.",
    "Measure labor mobility, small-business burden, coverage churn, household security, and net fiscal effects rather than assuming detachment from employment is automatically better.",
  ],
  benefits: [
    "Workers gain more freedom to change jobs, start firms, reduce hours, or leave unstable employment without immediate medical insecurity.",
    "Small employers face less pressure to function as healthcare administrators or benefit gatekeepers.",
    "The healthcare system becomes easier to evaluate because coverage rules are less entangled with labor-market status.",
    "Public debate gains a clearer line between healthcare design and employment design rather than forcing both into one inherited structure.",
  ],
  risks: [
    "Transition could be politically and operationally chaotic if wage adjustments, tax treatment, and household costs are not handled clearly.",
    "Portability may improve security while still leaving underlying healthcare prices and provider power largely untouched.",
    "Large employers and unionized workers may resist if they fear losing negotiated benefit quality or leverage.",
    "A badly designed transition could create new administrative layers instead of actually simplifying the system.",
  ],
  assumptions: [
    "The employment link is a real structural distortion rather than merely a familiar financing channel with manageable side effects.",
    "Portable coverage can be designed clearly enough that households do not simply inherit a more confusing system at a different access point.",
    "Compensation, tax policy, and transition support can be reworked without producing politically fatal disruption.",
    "Detaching healthcare from employment creates meaningful gains in labor mobility, resilience, and public legibility even if it does not solve every cost problem.",
  ],
  stakeholders: [
    "Workers and job seekers",
    "Families with unstable coverage histories",
    "Small businesses and employers",
    "Large employers and unions",
    "Insurers and exchange operators",
    "Governments and tax systems",
    "Providers and hospital systems",
    "People with chronic conditions who face continuity risk",
  ],
  evidence: [
    {
      title: "Job lock and labor-mobility research",
      status: "Strong evidence",
      note: "Useful for testing whether workers stay in suboptimal jobs because they fear losing coverage or continuity of care.",
    },
    {
      title: "Coverage churn data during layoffs and job transitions",
      status: "Strong evidence",
      note: "Important for seeing how often employment-linked coverage creates instability at moments of household vulnerability.",
    },
    {
      title: "Small-business benefit burden and administrative complexity",
      status: "Useful but uneven",
      note: "Supports the employer-burden case, though business size and sector create large differences in experience.",
    },
    {
      title: "Portable coverage systems reduce total healthcare distortion overall",
      status: "Needs verification",
      note: "This is a central hope of the model, but it depends heavily on transition design and what replaces the employer link in practice.",
    },
  ] satisfies EvidenceSummary[],
  economicDelta: {
    summary:
      "Estimated Economic Delta: Potentially meaningful if labor mobility, entrepreneurship, household stability, and employer efficiency improve, but highly sensitive to transition design. Main costs include tax restructuring, benefit conversion, political resistance, continuity protections, and whatever public or exchange architecture replaces employer administration. Confidence remains moderate-to-low until a transition pathway is modeled more concretely.",
    metrics: [
      "Possible labor-market gain: positive if job lock falls materially",
      "Employer burden reduction: potentially high for smaller firms",
      "Transition cost: high because wages, benefits, and tax treatment all move together",
      "Household clarity: positive only if the new coverage path is simpler in practice",
      "Underlying healthcare-price effect: uncertain unless paired with deeper cost reform",
    ],
  },
  strongestSupport:
    "This topic card makes visible one of the healthcare room's cleanest structural questions: a system that ties medical security to employment may be distorting both healthcare and work at the same time.",
  strongestObjection:
    "Detaching coverage from employment can sound elegant while simply moving complexity elsewhere. If replacement pathways are confusing, underfunded, or politically unstable, households may lose familiar protections without gaining real security.",
  whatWouldStrengthen: [
    "A clearer phased transition showing what happens to wages, employer contributions, tax treatment, and coverage continuity year by year.",
    "Better evidence on how much labor mobility, entrepreneurship, and household resilience actually improve when medical security becomes more portable.",
    "Sharper comparison with public-option and single-payer pathways so portability is not treated as an isolated abstraction.",
  ],
  openQuestions: [
    "What is the least disruptive path to reducing the employment link without throwing households into coverage churn?",
    "How should employer contributions be converted or reallocated during transition?",
    "Would portable coverage improve freedom while still preserving provider networks and continuity of care for high-need patients?",
    "How much of the current system's cost and complexity is caused by the employment link versus larger pricing and institutional problems?",
  ],
  maturity: "Seed topic",
  scorecard: [
    { label: "Novelty", value: 71 },
    { label: "Coherence", value: 84 },
    { label: "Feasibility", value: 53 },
    { label: "Evidence quality", value: 61 },
    { label: "Economic delta clarity", value: 58 },
    { label: "Public value", value: 86 },
  ],
  aiPanels: [
    {
      role: "Structurer",
      confidence: "Moderate",
      summary:
        "The topic card sharpens the employer-burden frame into a specific structural question and keeps labor mobility, household security, and transition design in one object.",
    },
    {
      role: "Steelman",
      confidence: "Moderate",
      summary:
        "If healthcare becomes more portable, the system may reduce job lock, improve entrepreneurial freedom, and make public reasoning about healthcare financing much cleaner.",
    },
    {
      role: "Critic",
      confidence: "Moderate",
      summary:
        "The model risks sounding cleaner than it is because portability does not automatically fix prices, provider incentives, or the politics of replacement architecture.",
    },
    {
      role: "Institutionalist",
      confidence: "Low",
      summary:
        "The hardest part is not conceptual but transitional: employers, unions, insurers, and governments all need a credible reallocation path before the room can treat this as more than a structural critique.",
    },
  ],
  debatePrompts: [
    {
      title: "Support",
      description: "Add the strongest argument for why healthcare should become more portable and less dependent on employment status.",
    },
    {
      title: "Objection",
      description: "Surface the strongest reason detaching coverage from employment could worsen instability, complexity, or political viability.",
    },
    {
      title: "Evidence",
      description: "Add labor-mobility, coverage-churn, or employer-burden evidence that strengthens or weakens the card.",
    },
    {
      title: "Correction",
      description: "Identify conceptual, fiscal, or transition-design errors in the current card.",
    },
    {
      title: "Nuance",
      description: "Improve the topic by exposing a missing tradeoff between portability, continuity, cost control, and political feasibility.",
    },
    {
      title: "Implementation concern",
      description: "Identify how employers, unions, exchanges, or governments could make a transition fail even if the structural case is good.",
    },
    {
      title: "Economic assumption challenge",
      description: "Question whether labor-market and household gains are large enough to justify the transition cost and redesign overhead.",
    },
    {
      title: "Alternate topic",
      description: "Offer a better way to reduce job lock and employer burden without fully detaching healthcare security from work.",
    },
    {
      title: "Stakeholder perspective",
      description: "Add the view of a worker, small employer, union negotiator, insurer, or chronic-care patient affected by the employment link.",
    },
  ] satisfies DebatePrompt[],
  revisionHistory: [
    {
      version: "v0.1",
      date: "May 2026",
      note: "Initial seed topic card created to turn the employment-link question into a full inspectable healthcare object rather than leaving it at the frame level.",
    },
    {
      version: "v0.2",
      date: "May 2026",
      note: "Transition cost, wage conversion, and continuity-of-care concerns were raised to first-order visibility instead of being treated as downstream details.",
    },
    {
      version: "v0.3",
      date: "May 2026",
      note: "The card was sharpened around portability, employer burden, and labor mobility so the structural choice is easier to compare against other healthcare directions.",
    },
  ],
};

export const topic003: TopicCardData = {
  id: "topic-003",
  title: "Rural Healthcare Stabilization Model",
  subtitle:
    "A third healthcare topic card for testing whether reform can preserve edge-case access instead of optimizing only for national averages",
  draftNote:
    "This topic card is intentionally unfinished because rural healthcare is where elegant reform language often breaks. It is meant to force a harder question into the room: what kind of healthcare system still works when distance is long, staffing is thin, emergency access is fragile, and local hospitals are one shock away from failure?",
  thesis:
    "Any serious healthcare reform should include a rural-capacity layer that explicitly protects emergency access, core provider presence, and financially fragile hospitals, even when that means using subsidy, different reimbursement rules, and lower-efficiency service models than a dense urban system would tolerate.",
  currentRead:
    "This topic card feels strong because it pressures one of the room's most important edge cases directly: national reform can look cleaner on paper than it does in sparsely populated regions. It feels weak wherever it risks becoming a blanket excuse for preserving every existing rural institution regardless of quality, density, or outcomes. The card is useful because it makes clear that healthcare access is not only a financing problem but also a geographic and infrastructural one.",
  problemStatement:
    "Rural hospitals, clinics, and provider pipelines often operate with lower patient volume, thinner staffing, longer transport times, and weaker margins than urban systems. Reforms aimed at cost savings, administrative simplification, or reimbursement changes may improve national averages while unintentionally destabilizing emergency access, maternity care, trauma response, primary care continuity, and specialist referral pathways in rural regions.",
  proposedSolution:
    "Create a rural-stabilization layer inside broader healthcare reform: define which services must remain geographically reachable, build targeted reimbursement floors or global budgets for essential rural capacity, support shared staffing and telehealth backstops, and evaluate reform models against edge-case access rather than treating rural decline as a secondary implementation detail.",
  mechanism: [
    "Define the minimum rural healthcare capacities a serious system should preserve, such as emergency stabilization, maternity pathways, primary care continuity, and transfer coordination.",
    "Use targeted reimbursement floors, essential-service budgets, or access-based support rather than forcing fragile rural providers into the same efficiency expectations as dense urban systems.",
    "Pair physical capacity with telehealth, shared specialist networks, transport coordination, and provider-pipeline support so rural care is stabilized as a system rather than as a single building.",
    "Evaluate broader reforms against rural access metrics early, including closure risk, travel time, staffing resilience, and continuity of care for high-need populations.",
  ],
  benefits: [
    "The room gets a concrete answer to one of its hardest recurring objections: reform should not quietly sacrifice edge-case access to improve average efficiency.",
    "Rural patients and families gain stronger protection against the collapse of emergency, maternity, and basic primary-care access.",
    "Healthcare reforms become easier to compare honestly because provider stability and geography are treated as first-order design variables.",
    "The system can preserve strategic care capacity in places where pure market volume is too weak to sustain it.",
  ],
  risks: [
    "A stabilization layer can become an expensive patch that preserves weak institutions without enough quality, accountability, or redesign pressure.",
    "Different reimbursement rules may provoke fairness and political resistance if urban systems believe they are subsidizing permanent inefficiency.",
    "Telehealth and transport coordination may be oversold as substitutes for real local capacity when they are only partial supports.",
    "Targeted rural support can still fail if workforce pipelines, housing, and regional economics remain too weak to retain providers.",
  ],
  assumptions: [
    "Rural healthcare fragility is not a side issue but a core test of whether a healthcare system actually serves the whole country.",
    "Different reimbursement and support structures can preserve access without becoming pure institutional life support.",
    "A system can distinguish between essential geographic capacity and the indefinite preservation of every existing rural provider configuration.",
    "Edge-case access should meaningfully constrain healthcare reform even when it complicates national efficiency goals.",
  ],
  stakeholders: [
    "Rural patients and families",
    "Rural hospitals and clinics",
    "Emergency transport systems",
    "Doctors, nurses, and regional provider pipelines",
    "State and federal health agencies",
    "Urban referral hospitals and specialist hubs",
    "Insurers and reimbursement systems",
    "Taxpayers and regional economic planners",
  ],
  evidence: [
    {
      title: "Rural hospital closure and margin data",
      status: "Strong evidence",
      note: "Critical for seeing where access fragility is already present before new reforms add pressure.",
    },
    {
      title: "Travel-time and emergency-outcome comparisons",
      status: "Strong evidence",
      note: "Useful for testing which losses of local capacity create unacceptable clinical or household risk.",
    },
    {
      title: "Telehealth and shared-network support can fully replace local capacity",
      status: "Needs verification",
      note: "Often assumed, but highly dependent on broadband, staffing, transfer systems, and case mix.",
    },
    {
      title: "Targeted rural reimbursement or global-budget support preserves meaningful access efficiently",
      status: "Useful but uneven",
      note: "Supports the idea of a separate rural-capacity layer, but implementation quality matters heavily.",
    },
  ] satisfies EvidenceSummary[],
  economicDelta: {
    summary:
      "Estimated Economic Delta: Mixed but strategically important. A rural-stabilization layer may raise visible spending in the short term while preventing hidden costs from hospital closure, delayed care, regional decline, emergency transfer burdens, and household insecurity. Confidence remains moderate-to-low because the value case depends on how access, workforce, and subsidy design are measured rather than on a simple cost-cutting frame.",
    metrics: [
      "Direct cost pressure: likely positive because stabilization often requires explicit support",
      "Hidden cost avoidance: potentially high if closures, delayed care, and transfer burdens fall",
      "Political value: high because rural neglect can delegitimize national reform quickly",
      "Efficiency profile: weaker on paper than dense urban systems, stronger on geographic resilience",
      "Economic-delta confidence: low to moderate until closure-risk and access-value models improve",
    ],
  },
  strongestSupport:
    "This topic card forces the healthcare room to answer whether reform is real for the whole country or only for average-case metrics. It keeps provider stability, geography, and emergency access inside the public reasoning object instead of letting them surface only as late objections.",
  strongestObjection:
    "Rural stabilization can become a euphemism for subsidizing low-volume institutions indefinitely without enough redesign, accountability, or quality improvement. If that happens, the model may preserve fragility rather than solve it.",
  whatWouldStrengthen: [
    "A sharper definition of which rural capacities are non-negotiable and which provider forms are historically inherited rather than actually necessary.",
    "Better modeling of closure costs, transfer burdens, travel-time risk, and regional economic spillovers from losing care infrastructure.",
    "Examples of rural support mechanisms that improved resilience without simply freezing the status quo in place.",
  ],
  openQuestions: [
    "What minimum local care capacities should every serious healthcare system guarantee in rural regions?",
    "How should rural access be weighed against national cost efficiency when the two conflict directly?",
    "What is the right mix of local capacity, telehealth, transport, and referral-network support?",
    "How can the model distinguish between preserving essential access and preserving every existing institution?",
  ],
  maturity: "Seed topic",
  scorecard: [
    { label: "Novelty", value: 69 },
    { label: "Coherence", value: 86 },
    { label: "Feasibility", value: 61 },
    { label: "Evidence quality", value: 64 },
    { label: "Economic delta clarity", value: 49 },
    { label: "Public value", value: 90 },
  ],
  aiPanels: [
    {
      role: "Structurer",
      confidence: "Moderate",
      summary:
        "The topic card gives the healthcare room a serious edge-case object by making geography, emergency access, and provider fragility first-order rather than downstream concerns.",
    },
    {
      role: "Steelman",
      confidence: "Moderate",
      summary:
        "If a healthcare system cannot survive its rural cases, it is not yet a coherent national system. This card keeps the room honest about that.",
    },
    {
      role: "Critic",
      confidence: "Moderate",
      summary:
        "The card can too easily collapse into subsidy language without enough distinction between preserving access and preserving historically inherited institutional forms.",
    },
    {
      role: "Institutionalist",
      confidence: "Low",
      summary:
        "The strongest version of the idea likely requires a hybrid of explicit support, network coordination, and service redesign rather than simply paying more into the existing rural map.",
    },
  ],
  debatePrompts: [
    {
      title: "Support",
      description: "Add the strongest argument for why rural-capacity protection should constrain healthcare reform even when it raises visible cost.",
    },
    {
      title: "Objection",
      description: "Surface the strongest reason a rural-stabilization layer could become inefficient institutional preservation rather than real access design.",
    },
    {
      title: "Evidence",
      description: "Add closure, travel-time, workforce, or emergency-outcome evidence that strengthens or weakens the card.",
    },
    {
      title: "Correction",
      description: "Identify conceptual, fiscal, or service-design errors in the current card.",
    },
    {
      title: "Nuance",
      description: "Improve the topic by exposing a missing tradeoff between access, quality, cost, and geographic resilience.",
    },
    {
      title: "Implementation concern",
      description: "Identify how reimbursement systems, workforce shortages, or political incentives could make rural stabilization fail in practice.",
    },
    {
      title: "Economic assumption challenge",
      description: "Question whether the avoided closure and access harms are large enough to justify the explicit support this model would require.",
    },
    {
      title: "Alternate topic",
      description: "Offer a better way to preserve edge-case access without building a separate rural-capacity layer.",
    },
    {
      title: "Stakeholder perspective",
      description: "Add the view of a rural patient, hospital administrator, nurse, emergency transport worker, or state health official.",
    },
  ] satisfies DebatePrompt[],
  revisionHistory: [
    {
      version: "v0.1",
      date: "May 2026",
      note: "Initial seed topic card created to turn rural access and provider fragility into a full inspectable healthcare object instead of a background caveat.",
    },
    {
      version: "v0.2",
      date: "May 2026",
      note: "The card was sharpened around minimum geographic capacity, closure risk, and the distinction between preserving access versus preserving every existing institution.",
    },
    {
      version: "v0.3",
      date: "May 2026",
      note: "Economic-delta framing was expanded to include hidden closure costs, emergency burdens, and regional resilience instead of relying on a narrow efficiency lens.",
    },
  ],
};

export const governanceTopic001: TopicCardData = {
  id: "topic-001",
  title: "Subsidiarity-First Governance Model",
  subtitle:
    "A first governance topic card for testing whether authority should move downward by default while still preserving common capacity and rights protection",
  draftNote:
    "This topic card is intentionally unfinished because governance arguments often sound cleaner than they are. It is meant to make one recurring institutional instinct inspectable: push authority downward wherever possible, but do not pretend local control solves every coordination or justice problem.",
  thesis:
    "Governance should default toward subsidiarity: authority should sit as close as possible to the people who live with the consequences, while a thinner higher layer protects rights, coordinates large systems, and intervenes only where scale or spillover makes local control inadequate.",
  currentRead:
    "This topic card feels strongest because it answers one of the deepest legitimacy problems directly: many people experience governance as too distant, too opaque, and too insulated from consequence. It feels weakest wherever local knowledge is romanticized and local capture, uneven competence, and coordination failure are underweighted. The card is useful because it forces governance arguments to specify what really must stay central and what should move downward.",
  problemStatement:
    "High-complexity societies often centralize authority for efficiency, expertise, and standardization, but centralization can also weaken legitimacy, flatten local knowledge, and create institutions that are formally accountable yet practically remote. At the same time, pure decentralization can leave rights unevenly protected, infrastructure fragmented, and crisis coordination too weak. The problem is not merely where power sits, but how authority can be allocated so that correction remains possible at every level.",
  proposedSolution:
    "Use subsidiarity as a governing default: place decisions at the lowest competent and accountable level, then reserve higher-order authority for constitutional rights, large-scale infrastructure, spillover problems, emergency coordination, and domains where local capture or incapacity is too high. Make the boundaries explicit enough that centralization must justify itself rather than silently expanding by habit.",
  mechanism: [
    "Map governance functions by scale and spillover instead of treating all public authority as if it belongs at the same level.",
    "Assign routine and place-sensitive decisions to the most local competent layer that can actually bear responsibility for outcomes.",
    "Retain higher-level authority for rights protection, interstate coordination, large infrastructure, national defense, and failures local systems cannot correct alone.",
    "Create visible correction paths so citizens can see which layer decided, which layer can review it, and when escalation to a higher layer is justified.",
  ],
  benefits: [
    "Local knowledge and public feedback loops become more relevant to actual decision-making.",
    "Legitimacy may improve when people can identify who decided, why, and how to challenge failure.",
    "Central institutions can focus on domains that truly require scale rather than absorbing every public problem.",
    "The model surfaces coordination questions directly instead of burying them inside one-size-fits-all administration.",
  ],
  risks: [
    "Local control can entrench local capture, prejudice, incompetence, or fiscal weakness rather than civic responsibility.",
    "Citizens may celebrate decentralization rhetorically while rejecting the uneven outcomes it produces in practice.",
    "Central governments may still creep downward into local domains unless hard boundaries and correction rules exist.",
    "In crisis conditions, fragmented authority can slow action or produce blame-shifting instead of accountability.",
  ],
  assumptions: [
    "Many governance failures come from authority being too distant rather than simply too weak.",
    "Local institutions can be made competent enough to handle a broader share of public decisions.",
    "Rights protection and anti-capture safeguards can be preserved even when more authority moves downward.",
    "Citizens can tolerate meaningful differences across jurisdictions if the system remains legible and fair enough.",
  ],
  stakeholders: [
    "Citizens and local communities",
    "Municipal and county governments",
    "State or provincial governments",
    "National legislatures and executives",
    "Courts and constitutional bodies",
    "Civil servants and regulators",
    "Minority groups vulnerable to local abuse",
    "Future residents inheriting governance design",
  ],
  evidence: [
    {
      title: "Local knowledge often improves policy fit and public legitimacy",
      status: "Useful but uneven",
      note: "Supports subsidiarity in many domains, though it does not guarantee competence or fairness.",
    },
    {
      title: "Centralized systems can coordinate large infrastructure and rights enforcement more reliably",
      status: "Strong evidence",
      note: "This is the clearest reason subsidiarity cannot simply mean localism everywhere.",
    },
    {
      title: "Local capture and unequal capacity are recurring governance problems",
      status: "Strong evidence",
      note: "A subsidiarity model has to answer this directly or it becomes a romantic theory of decentralization.",
    },
    {
      title: "Clear escalation and correction pathways improve trust in layered systems",
      status: "Needs verification",
      note: "The idea is plausible but still depends on institutional design quality and civic literacy.",
    },
  ] satisfies EvidenceSummary[],
  economicDelta: {
    summary:
      "Estimated Economic Delta: Unknown but potentially meaningful if subsidiarity reduces bureaucratic friction, increases local problem-solving quality, and reserves expensive central capacity for genuinely high-scale functions. Main costs include uneven local capacity, transition complexity, oversight needs, and possible duplication across jurisdictions. Confidence remains low until specific domains are tested rather than theorized in the abstract.",
    metrics: [
      "Possible local-efficiency gains: positive if authority and competence align",
      "Implementation cost: moderate because boundaries and oversight have to be redesigned",
      "Coordination cost: potentially high in infrastructure, health, or emergency domains",
      "Public-trust upside: potentially meaningful if legitimacy visibly improves",
      "Inequality risk: elevated if weak jurisdictions are left without real support",
    ],
  },
  strongestSupport:
    "This topic speaks directly to a foundational civic intuition: people trust governance more when decisions are made closer to lived consequence and when escalation to higher authority has to justify itself.",
  strongestObjection:
    "Subsidiarity can become an elegant moral cover for fragmentation, unequal rights, local corruption, and under-capacity unless the system makes hard decisions about what cannot safely be left local.",
  whatWouldStrengthen: [
    "Concrete domain-by-domain mapping showing which governance functions should be local, regional, or central and why.",
    "Case comparisons where decentralization improved legitimacy or outcomes without quietly worsening inequality or capture.",
    "A clearer escalation rule for when higher authority can or must override local control.",
  ],
  openQuestions: [
    "Which rights or services should never depend on local willingness or competence alone?",
    "How should weak local jurisdictions be supported without recentralizing everything by default?",
    "What metrics best distinguish legitimate local diversity from unacceptable local failure?",
    "How should emergency powers interact with a subsidiarity-first constitutional order?",
  ],
  maturity: "Seed topic",
  scorecard: [
    { label: "Novelty", value: 61 },
    { label: "Coherence", value: 84 },
    { label: "Feasibility", value: 58 },
    { label: "Evidence quality", value: 53 },
    { label: "Economic delta clarity", value: 44 },
    { label: "Public value", value: 81 },
  ],
  aiPanels: [
    {
      role: "Structurer",
      confidence: "Moderate",
      summary:
        "The topic is now explicit about boundaries, escalation, and failure modes instead of treating decentralization as a vibe or a slogan.",
    },
    {
      role: "Steelman",
      confidence: "Moderate",
      summary:
        "Subsidiarity can restore legitimacy by moving authority closer to consequence while preserving a thinner central layer for rights and coordination.",
    },
    {
      role: "Critic",
      confidence: "Moderate",
      summary:
        "Without a serious answer to local capture and unequal capacity, the model risks sounding humane while offloading harm onto weaker communities.",
    },
    {
      role: "Institutionalist",
      confidence: "Low",
      summary:
        "The idea is strongest when treated as a domain-by-domain design rule rather than as one total constitutional answer for every public function.",
    },
  ],
  debatePrompts: [
    {
      title: "Support",
      description: "Add the strongest argument for why subsidiarity should be the default allocation rule in governance.",
    },
    {
      title: "Objection",
      description: "Surface the strongest reason the model could fail, fragment authority, or protect local abuse.",
    },
    {
      title: "Evidence",
      description: "Add case studies, constitutional examples, or institutional comparisons that support or weaken the subsidiarity case.",
    },
    {
      title: "Correction",
      description: "Identify conceptual, legal, or historical errors in the current card.",
    },
    {
      title: "Nuance",
      description: "Improve the topic by exposing a missing condition or boundary rule without rejecting subsidiarity entirely.",
    },
    {
      title: "Governance concern",
      description: "Identify where accountability, escalation, or anti-capture design could quietly fail inside this model.",
    },
    {
      title: "Economic assumption challenge",
      description: "Question whether the legitimacy gains and local-efficiency gains are strong enough to offset coordination and inequality costs.",
    },
    {
      title: "Alternate topic",
      description: "Offer a better governance allocation rule for balancing legitimacy, competence, and liberty.",
    },
    {
      title: "Institutional perspective",
      description: "Add the likely view of a court, regulator, governor, mayor, or local community that would have to live inside this design.",
    },
  ] satisfies DebatePrompt[],
  revisionHistory: [
    {
      version: "v0.1",
      date: "May 2026",
      note: "Initial seed topic card created to give the governance room a concrete object around authority allocation rather than leaving it at the framing level.",
    },
    {
      version: "v0.2",
      date: "May 2026",
      note: "Local capture and unequal-capacity risks were raised to first-order visibility instead of being treated as secondary complications.",
    },
    {
      version: "v0.3",
      date: "May 2026",
      note: "Escalation rules and domain-by-domain mapping were made explicit so the model reads as a governance design problem, not just a political instinct.",
    },
  ],
};

export const governanceTopic002: TopicCardData = {
  id: "topic-002",
  title: "Sortition and Citizen Review Hybrid",
  subtitle:
    "A second governance topic card for testing whether rotating citizen review can restore legitimacy without collapsing competence",
  draftNote:
    "This topic card is intentionally unfinished because sortition ideas are easy to romanticize. It is meant to make one legitimacy instinct inspectable: bring ordinary citizens back into governance review without pretending random selection automatically produces wisdom, fairness, or institutional durability.",
  thesis:
    "High-complexity governance can gain legitimacy and anti-capture pressure by combining expert process with rotating citizen review bodies that examine decisions, surface objections, and force public reasoning back into visible civic space.",
  currentRead:
    "This topic card feels strongest because it answers a real democratic injury directly: many people experience governance as something done to them by professionals, parties, courts, and administrative systems they can barely touch. It feels weakest wherever civic participation is idealized and the real burdens of competence, manipulation risk, and scale are underweighted. The card is useful because it asks not whether experts matter, but how expert governance stays publicly answerable.",
  problemStatement:
    "Modern governance often relies on professional expertise, party structures, administrative continuity, and procedural distance to manage complexity. That can improve competence, but it can also produce institutions that are hard to trust, hard to challenge, and easy to experience as insulated. Ordinary publics are then left with low-information elections, reactive outrage, or broad distrust rather than durable civic participation in review and correction.",
  proposedSolution:
    "Use a hybrid model where expert institutions continue doing specialized work, but selected citizen panels, assemblies, or review bodies are given structured roles in examining major decisions, hearing objections, reviewing tradeoffs, and producing visible public reasoning that can pressure or check formal institutions without pretending to replace them wholesale.",
  mechanism: [
    "Select citizen review bodies through transparent sortition or mixed selection processes designed to reduce factional capture and professional gatekeeping.",
    "Pair those bodies with expert briefings, structured objections, evidence packets, and visible facilitation so participation is informed rather than purely symbolic.",
    "Assign review roles to domains where legitimacy and public trust matter most, such as oversight, contested reforms, emergency review, or institutional accountability rather than every routine administrative choice.",
    "Publish the review record, disagreements, recommendations, and correction pathways so citizen involvement becomes durable civic memory instead of one-time consultation theater.",
  ],
  benefits: [
    "Governance can regain some public legitimacy by creating visible civic participation between elections and beyond passive comment channels.",
    "Rotating citizen review may counter some forms of professional groupthink, party capture, and administrative insulation.",
    "The model can preserve expertise while still forcing major institutional choices into more publicly intelligible reasoning spaces.",
    "Civic Logos gains a governance-native object for thinking about review, correction, and legitimacy without collapsing into plebiscitary politics.",
  ],
  risks: [
    "Citizen review bodies can be manipulated, performative, or informationally overwhelmed if expert framing quietly dominates the process.",
    "Sortition can produce legitimacy theater if recommendations are visible but structurally easy for formal institutions to ignore.",
    "Highly technical domains may not lend themselves well to meaningful citizen review without large support overhead.",
    "The model could slow action or create another symbolic layer unless powers, scope, and escalation rules are sharply defined.",
  ],
  assumptions: [
    "Legitimacy can be materially improved by better civic review even when direct decision power remains mostly institutional.",
    "Ordinary citizens can contribute meaningfully when the process is structured, informed, and bounded rather than theatrical or purely adversarial.",
    "Expertise and public legitimacy do not have to be zero-sum if review roles are designed carefully.",
    "Institutional systems will accept some real public pressure from citizen review bodies instead of reducing them to ceremonial legitimacy props.",
  ],
  stakeholders: [
    "Citizens and local communities",
    "Legislatures and executives",
    "Civil servants and regulators",
    "Courts and constitutional bodies",
    "Political parties and campaigns",
    "Expert communities and advisors",
    "Watchdogs and journalists",
    "Minority groups vulnerable to majoritarian distortion",
  ],
  evidence: [
    {
      title: "Citizens' assemblies and deliberative panels can improve legitimacy and quality of discussion under structured conditions",
      status: "Useful but uneven",
      note: "Supports the core intuition, though outcomes vary a lot by mandate, facilitation, and institutional uptake.",
    },
    {
      title: "Technical and institutional complexity often overwhelms ordinary public review without strong scaffolding",
      status: "Strong evidence",
      note: "This is the clearest reason the model must stay hybrid rather than pretending raw participation solves competence problems.",
    },
    {
      title: "Symbolic participation processes are often ignored once the public ritual is complete",
      status: "Strong evidence",
      note: "A real governance role requires visible consequence and correction pathways, not just consultation theater.",
    },
    {
      title: "Citizen review can resist capture more effectively than party-mediated participation at scale",
      status: "Needs verification",
      note: "This remains one of the most attractive but least settled assumptions behind the model.",
    },
  ] satisfies EvidenceSummary[],
  economicDelta: {
    summary:
      "Estimated Economic Delta: Indirect but potentially meaningful if better legitimacy, lower capture, and more trusted oversight improve policy quality and reduce expensive distrust cycles. Main costs include facilitation, briefing, process design, participant support, and slower throughput in review-heavy domains. Confidence remains low-to-moderate because much of the value is institutional and preventive rather than immediately fiscal.",
    metrics: [
      "Possible legitimacy gain: potentially high if the process is visibly consequential",
      "Implementation cost: moderate because citizen review requires design, staffing, and support",
      "Throughput cost: elevated if the model is applied too broadly",
      "Capture reduction potential: meaningful but highly design-sensitive",
      "Competence risk: elevated in technical domains without strong expert scaffolding",
    ],
  },
  strongestSupport:
    "This topic card answers a central governance wound directly: many societies need more than elections and more than bureaucracy. They need visible civic review that can pressure institutions without pretending all expertise is fake or all direct democracy is wise.",
  strongestObjection:
    "Sortition can easily become a beautiful democratic symbol with weak real power, where selected citizens legitimize decisions they do not truly shape and where complex agendas are still set by experts, parties, or institutional staff behind the scenes.",
  whatWouldStrengthen: [
    "A clearer rule set for which domains citizen review can actually improve and which are too technical, time-sensitive, or rights-sensitive for this model to carry much weight.",
    "Comparative evidence on when deliberative panels produce durable institutional change versus ceremonial participation.",
    "A stronger theory of how recommendations, objections, and review outputs would bind or pressure formal governance structures in practice.",
  ],
  openQuestions: [
    "Which governance functions are best suited to citizen review rather than direct citizen decision?",
    "How can minority rights and anti-demagoguery protections be preserved inside sortition-based legitimacy models?",
    "What makes a citizen review body genuinely consequential rather than symbolic?",
    "How much expert framing is necessary before a hybrid model simply becomes expert governance with public decoration?",
  ],
  maturity: "Seed topic",
  scorecard: [
    { label: "Novelty", value: 74 },
    { label: "Coherence", value: 80 },
    { label: "Feasibility", value: 52 },
    { label: "Evidence quality", value: 55 },
    { label: "Economic delta clarity", value: 41 },
    { label: "Public value", value: 85 },
  ],
  aiPanels: [
    {
      role: "Structurer",
      confidence: "Moderate",
      summary:
        "The topic is now framed as a review-and-legitimacy design rather than as generic participatory democracy, which makes its scope and tradeoffs much clearer.",
    },
    {
      role: "Steelman",
      confidence: "Moderate",
      summary:
        "A hybrid sortition model could restore civic trust by letting ordinary citizens visibly pressure institutions without pretending technical governance can be crowdsourced wholesale.",
    },
    {
      role: "Critic",
      confidence: "Moderate",
      summary:
        "Without real consequence, the model risks becoming democratic theater; with too much consequence, it risks overload, manipulation, or poorly informed review in complex domains.",
    },
    {
      role: "Institutionalist",
      confidence: "Low",
      summary:
        "The idea is strongest when treated as a bounded oversight and legitimacy mechanism, not as a universal replacement for representative or administrative institutions.",
    },
  ],
  debatePrompts: [
    {
      title: "Support",
      description: "Add the strongest argument for why sortition-based citizen review could improve legitimacy without sacrificing too much competence.",
    },
    {
      title: "Objection",
      description: "Surface the strongest reason the model could become symbolic, manipulable, or dangerously underinformed.",
    },
    {
      title: "Evidence",
      description: "Add examples of citizens' assemblies, review panels, or deliberative bodies that support or weaken the hybrid model.",
    },
    {
      title: "Correction",
      description: "Identify conceptual, constitutional, or process-design errors in the current card.",
    },
    {
      title: "Nuance",
      description: "Improve the topic by exposing a missing boundary between citizen legitimacy review and expert operational competence.",
    },
    {
      title: "Governance concern",
      description: "Identify how agenda setting, facilitation, or institutional uptake could quietly empty the citizen-review layer of real force.",
    },
    {
      title: "Economic assumption challenge",
      description: "Question whether legitimacy gains and anti-capture gains are large enough to justify the review overhead and slower process.",
    },
    {
      title: "Alternate topic",
      description: "Offer a better legitimacy-restoring governance model than sortition and citizen review hybridization.",
    },
    {
      title: "Institutional perspective",
      description: "Add the likely view of a judge, civil servant, mayor, legislator, or ordinary citizen who would have to live inside this design.",
    },
  ] satisfies DebatePrompt[],
  revisionHistory: [
    {
      version: "v0.1",
      date: "May 2026",
      note: "Initial seed topic card created to turn the citizen-review legitimacy instinct into a real inspectable object inside the governance room.",
    },
    {
      version: "v0.2",
      date: "May 2026",
      note: "Symbolic participation, expert framing, and low-consequence theater risks were raised to first-order visibility rather than left implicit.",
    },
    {
      version: "v0.3",
      date: "May 2026",
      note: "The card was sharpened around bounded oversight, legitimacy pressure, and consequence pathways so it reads as governance design rather than participatory idealism.",
    },
  ],
};

export const housingTopic001: TopicCardData = {
  id: "topic-001",
  title: "Abundance and Zoning Reform Model",
  subtitle:
    "A first housing topic card for testing whether artificial scarcity in land use and approvals is the most leverageable driver of high housing cost",
  draftNote:
    "This topic card is intentionally unfinished because housing arguments often hide their hardest tradeoffs behind one clean moral emphasis. It is meant to make the abundance instinct inspectable without pretending supply alone dissolves displacement, infrastructure, or local legitimacy problems.",
  thesis:
    "High-cost regions should move toward abundance by legalizing more homes by right, reducing discretionary approval choke points, and treating a large share of housing scarcity as a policy-created condition rather than as an unavoidable fact of modern life.",
  currentRead:
    "This topic card feels strongest because it identifies a recurring structural failure clearly: places with high demand often make new housing too slow, too uncertain, and too politically discretionary to arrive at meaningful scale. It feels weakest wherever it assumes more legal capacity will translate cleanly into affordable outcomes without stronger answers on infrastructure, transitional displacement, capital structure, and where new units actually land. The card is useful because it forces the room to ask whether scarcity is primarily natural, financial, or political.",
  problemStatement:
    "Many high-cost regions face rising rents, delayed household formation, longer commutes, displacement pressure, and declining affordability even while demand to live and work there remains strong. A major claim in the room is that land use rules, permitting delay, low-density defaults, and discretionary local veto systems make housing supply far harder to deliver than it needs to be. The opposing concern is that rapid buildout can feel imposed, destabilizing, or extractive if infrastructure, neighborhood trust, and resident protection are treated as secondary.",
  proposedSolution:
    "Legalize substantially more housing capacity by right in high-demand areas, especially missing-middle and transit-accessible development; compress discretionary approval pathways; and combine abundance reforms with visible anti-displacement, infrastructure, and public-benefit mechanisms so the system delivers more homes without pretending the transitional politics disappear.",
  mechanism: [
    "Expand by-right building envelopes so more housing can be approved without endless discretionary negotiation.",
    "Reduce entitlement delay, uncertainty, and local veto chokepoints that raise cost before construction even begins.",
    "Target missing-middle, infill, and transit-adjacent growth as the first large-scale test of abundance rather than only towers or greenfield expansion.",
    "Pair legal capacity increases with infrastructure sequencing, tenant protection, and clearer public-benefit recapture so abundance does not read as pure developer privilege.",
  ],
  benefits: [
    "More legal housing capacity may lower long-run scarcity pressure and reduce rent escalation in high-demand regions.",
    "Builders, lenders, and municipalities gain more predictable approval environments, which can reduce carrying cost and project failure.",
    "Regions may improve labor mobility, household formation, and commute patterns if more homes can actually be built where demand exists.",
    "The room gains a concrete object for testing whether policy-created scarcity is a primary causal driver instead of a convenient narrative.",
  ],
  risks: [
    "Upzoning and legal capacity increases may still produce luxury-heavy output, slow affordability relief, or geographically uneven benefits.",
    "Neighborhood backlash can intensify if reform is experienced as override without infrastructure, design quality, or local legitimacy.",
    "Displacement pressure may remain acute in transition periods even if long-run supply logic is directionally correct.",
    "Landowners and sophisticated developers may capture much of the upside if public-benefit and anti-speculation mechanisms are weak.",
  ],
  assumptions: [
    "A significant share of observed scarcity is policy-created rather than physically unavoidable.",
    "Developers will respond to legal and process reform with materially higher housing production in the places that matter most.",
    "Household affordability improves meaningfully when supply constraints loosen enough, even if the effect is not immediate.",
    "Political legitimacy can survive stronger regional or state override if the abundance case is paired with visible fairness safeguards.",
  ],
  stakeholders: [
    "Renters and first-time buyers",
    "Longtime homeowners",
    "Developers and builders",
    "Planning boards and city councils",
    "Transit agencies and infrastructure providers",
    "Tenant advocates and anti-displacement groups",
    "Regional employers and workers",
    "Future households priced out today",
  ],
  evidence: [
    {
      title: "Zoning and permitting restrictions measurably constrain housing production in many high-demand regions",
      status: "Strong evidence",
      note: "Supports the core claim that scarcity is at least partly policy-created rather than simply natural.",
    },
    {
      title: "Additional supply can reduce overall market pressure over time",
      status: "Strong evidence",
      note: "Important to the abundance case, though timing and local distribution of benefit remain contested.",
    },
    {
      title: "Displacement and neighborhood-change effects vary widely by context",
      status: "Contested evidence",
      note: "This is the clearest reason the card cannot rely on one simple moral story about building more homes.",
    },
    {
      title: "Infrastructure and service capacity shape whether growth remains politically and socially durable",
      status: "Useful but incomplete",
      note: "Strengthens the case for pairing abundance with sequencing and public investment rather than treating approvals as the whole story.",
    },
  ] satisfies EvidenceSummary[],
  economicDelta: {
    summary:
      "Estimated Economic Delta: Potentially large if abundance reforms materially reduce long-run scarcity, commute burden, and labor-market distortion in high-cost regions. Main costs include infrastructure expansion, transition politics, anti-displacement measures, and the risk that supply arrives too slowly or in the wrong segments to deliver visible relief. Confidence remains moderate-low until the room maps out where legal capacity most reliably becomes real housing output.",
    metrics: [
      "Possible regional productivity gains: meaningful if workers can live closer to opportunity",
      "Implementation cost: moderate because legal reform is cheaper than direct construction but politically hard",
      "Infrastructure cost: potentially high where growth outpaces transit, schools, and utilities",
      "Household affordability impact: positive over time if supply becomes real and abundant enough",
      "Political backlash risk: high if reform is perceived as override without fairness or service planning",
    ],
  },
  strongestSupport:
    "This topic gives the housing room a sharp causal claim to test: many places are expensive not because housing is inherently impossible, but because policy has made abundance much harder than it needs to be.",
  strongestObjection:
    "The abundance frame can become a flattening ideology if it treats all resistance as selfishness and all new supply as socially beneficial regardless of timing, type, location, or who actually captures the gains.",
  whatWouldStrengthen: [
    "Regional case comparisons showing where abundance reforms measurably changed approvals, starts, and household affordability.",
    "A clearer anti-displacement layer explaining what protections are compatible with abundant supply rather than opposed to it.",
    "Better sequencing logic on transit, utilities, schools, and public space so the model addresses neighborhood legitimacy as well as unit count.",
  ],
  openQuestions: [
    "How much legal capacity needs to be unlocked before affordability effects become visible to ordinary households?",
    "Which anti-displacement protections are compatible with real abundance rather than symbolic alone?",
    "When should state or regional override defeat local veto, and how should that be justified publicly?",
    "How much of the value created by upzoning should be recaptured for public infrastructure or affordability support?",
  ],
  maturity: "Seed topic",
  scorecard: [
    { label: "Novelty", value: 56 },
    { label: "Coherence", value: 83 },
    { label: "Feasibility", value: 64 },
    { label: "Evidence quality", value: 61 },
    { label: "Economic delta clarity", value: 58 },
    { label: "Public value", value: 84 },
  ],
  aiPanels: [
    {
      role: "Structurer",
      confidence: "Moderate",
      summary:
        "The card now makes the abundance thesis explicit enough to test: approvals, legal capacity, transitional protection, and public-benefit sequencing are all visible objects rather than background assumptions.",
    },
    {
      role: "Steelman",
      confidence: "Moderate",
      summary:
        "If scarcity is substantially policy-created, zoning and permitting reform may be one of the highest-leverage ways to improve affordability and regional opportunity without waiting on much slower public-delivery systems.",
    },
    {
      role: "Critic",
      confidence: "Moderate",
      summary:
        "The card can still overread unit count as social success unless it treats displacement, infrastructure, and value capture as first-order design problems rather than afterthoughts.",
    },
    {
      role: "Urban systems reader",
      confidence: "Low",
      summary:
        "The idea is strongest when paired with region-specific sequencing and public-benefit recapture, not when presented as one universal abundance formula for every place.",
    },
  ],
  debatePrompts: [
    {
      title: "Support",
      description: "Add the strongest argument for why policy-created scarcity is the main driver of high housing cost in many regions.",
    },
    {
      title: "Objection",
      description: "Surface the strongest reason the abundance model could misfire, displace, or overpromise.",
    },
    {
      title: "Evidence",
      description: "Add case studies, empirical work, or comparative examples that support or weaken the zoning-and-abundance case.",
    },
    {
      title: "Correction",
      description: "Identify conceptual, urban, or historical errors in the current card.",
    },
    {
      title: "Nuance",
      description: "Improve the topic by exposing a missing condition or tradeoff without rejecting abundance entirely.",
    },
    {
      title: "Governance concern",
      description: "Identify how local legitimacy, regional override, or value capture could quietly break inside this model.",
    },
    {
      title: "Economic assumption challenge",
      description: "Question whether legal capacity actually becomes real housing fast enough to justify the political and infrastructure cost.",
    },
    {
      title: "Alternate topic",
      description: "Offer a better route for lowering housing pressure than an abundance-and-zoning-first model.",
    },
    {
      title: "Institutional perspective",
      description: "Add the likely view of a renter, homeowner, planner, mayor, transit agency, or builder that would have to live inside this design.",
    },
  ] satisfies DebatePrompt[],
  revisionHistory: [
    {
      version: "v0.1",
      date: "May 2026",
      note: "Initial seed topic card created to give the housing room a first concrete object around scarcity, approvals, and abundance.",
    },
    {
      version: "v0.2",
      date: "May 2026",
      note: "Displacement, local legitimacy, and value-capture concerns were raised to first-order visibility rather than treated as secondary caveats.",
    },
    {
      version: "v0.3",
      date: "May 2026",
      note: "Infrastructure sequencing and regional specificity were made more explicit so the model reads as urban systems design rather than a pure slogan.",
    },
  ],
};

export const housingTopic002: TopicCardData = {
  id: "topic-002",
  title: "Land Value Recapture Model",
  subtitle:
    "A second housing topic card for testing whether upzoning gains and public investment should flow back into shared housing benefit",
  draftNote:
    "This topic card is intentionally unfinished because it sits right at the political fault line of housing reform: if legal changes create land-value gains, who should capture them? The card is meant to make that fight inspectable instead of letting it hide inside a generic pro- or anti-development posture.",
  thesis:
    "When public action such as upzoning, infrastructure spending, or entitlement reform creates large private land-value gains, a meaningful share of that upside should be recaptured for public infrastructure, affordability, tenant protection, or community benefit rather than flowing entirely into private windfall.",
  currentRead:
    "This topic card feels strongest because it answers one of the clearest political objections to housing reform directly: many people will support more capacity only if they believe the upside does not become pure speculative gain. It feels weakest wherever recapture tools are treated as costless or frictionless, since badly designed extraction can freeze projects, reduce supply, or simply shift value into more complex avoidance behavior. The card is useful because it forces the room to ask not only whether more housing gets built, but who benefits when policy makes that possible.",
  problemStatement:
    "Housing reform often raises legal capacity, public infrastructure value, or development opportunity in ways that increase underlying land value. If those gains are captured almost entirely by landowners or sophisticated developers, the politics of abundance become much harder to sustain, and the public may reasonably feel that zoning reform socializes disruption while privatizing the reward. The room needs a clearer answer to how new value should be shared if housing reform is going to remain both effective and legitimate.",
  proposedSolution:
    "Pair major land-use and capacity reforms with structured value-recapture tools such as impact frameworks, linkage fees, land-value taxation variants, infrastructure benefit capture, affordability contributions, or district-level reinvestment rules so that housing growth creates visible public return instead of only private uplift.",
  mechanism: [
    "Identify where public action, zoning reform, or infrastructure spending is creating significant land-value appreciation rather than treating all price movement as ordinary market drift.",
    "Use bounded recapture tools that redirect part of the gain into infrastructure, affordability, tenant protection, or place-quality improvements without making delivery impossible.",
    "Tie recaptured value visibly to the communities and systems absorbing growth so the public can see what housing reform is funding, not just what it is permitting.",
    "Review recapture rates and exemptions carefully so the policy does not choke off supply, overreward incumbents, or create purely symbolic redistribution that fails to change conditions on the ground.",
  ],
  benefits: [
    "Makes housing reform politically stronger by showing how public action can create shared return rather than pure private windfall.",
    "Can fund infrastructure, affordability support, tenant stabilization, or public realm improvements that make growth more legitimate and workable.",
    "Clarifies one of the room's deepest moral questions: not just whether more housing arrives, but who captures the value created by collective decisions.",
    "Helps Civic Logos compare abundance models with more explicit distribution logic instead of forcing a false choice between supply and fairness.",
  ],
  risks: [
    "If recapture is too aggressive or badly timed, projects may stall, shrink, or never pencil out in the first place.",
    "Sophisticated actors may avoid or arbitrage the system while smaller builders bear a disproportionate compliance burden.",
    "Public-benefit promises can become symbolic if funds are poorly governed, delayed, or disconnected from the neighborhoods and systems carrying the change.",
    "The model can become a political compromise that sounds fair while leaving both supply delivery and redistribution weaker than advertised.",
  ],
  assumptions: [
    "A meaningful share of housing reform's upside is policy-created and therefore legitimately available for partial public recapture.",
    "Recapture tools can be designed precisely enough that they do not crush supply while still creating visible public benefit.",
    "Communities are more likely to accept change when the gains are legible and not captured entirely by incumbents or large developers.",
    "Public reinvestment funded by housing-value gains can materially improve infrastructure, affordability, or place quality rather than just disappearing into generic budgets.",
  ],
  stakeholders: [
    "Renters and future households",
    "Longtime homeowners and landowners",
    "Developers and smaller builders",
    "Cities, transit agencies, and utilities",
    "Tenant advocates and anti-displacement groups",
    "Taxpayers and local service systems",
    "Neighborhood groups absorbing growth",
    "Public officials designing land-use and finance rules",
  ],
  evidence: [
    {
      title: "Public action and zoning changes can create large private land-value gains",
      status: "Strong evidence",
      note: "Supports the core intuition that at least part of the upside is socially generated rather than purely entrepreneurial.",
    },
    {
      title: "Poorly designed fees and exactions can suppress production or distort project mix",
      status: "Strong evidence",
      note: "This is the clearest warning that recapture has to be calibrated rather than treated as free redistribution.",
    },
    {
      title: "Benefit-capture and reinvestment tools can fund infrastructure and public improvements in growth areas",
      status: "Useful but uneven",
      note: "Suggests the model can work in practice, though outcomes vary sharply by governance quality and market conditions.",
    },
    {
      title: "Value recapture can preserve legitimacy without meaningfully slowing supply overall",
      status: "Needs verification",
      note: "This is the key unresolved design claim and probably the most important thing a live housing room would have to test.",
    },
  ] satisfies EvidenceSummary[],
  economicDelta: {
    summary:
      "Estimated Economic Delta: Potentially meaningful if value recapture improves the political durability of housing reform and funds infrastructure or affordability without materially slowing supply. Main costs include project friction, administrative complexity, legal design, and the risk of reducing delivery if extraction outruns feasibility. Confidence remains moderate-to-low because the correct recapture rate is deeply context dependent.",
    metrics: [
      "Possible public-benefit gain: high if captured value is visibly reinvested well",
      "Supply risk: moderate to high if recapture tools are blunt or excessive",
      "Implementation cost: moderate because legal and fiscal design matter a lot",
      "Political legitimacy upside: potentially strong if gains are clearly shared",
      "Avoidance risk: elevated where sophisticated actors can route around the rules",
    ],
  },
  strongestSupport:
    "This topic card answers a real fairness problem in housing politics: if collective decisions create large private upside, the public needs a clearer share of the return or abundance can look like extraction in another form.",
  strongestObjection:
    "Value recapture can easily become a satisfying-sounding tax on development that weakens supply, empowers incumbents, or produces token public benefits while the underlying housing shortage remains severe.",
  whatWouldStrengthen: [
    "A clearer typology of which recapture tools work best in which market conditions instead of one generic public-benefit formula.",
    "Case evidence showing when recapture preserved public legitimacy without choking production or overcomplicating delivery.",
    "More specific rules for how captured value would be governed, geographically tied, and publicly tracked once collected.",
  ],
  openQuestions: [
    "How much of zoning or infrastructure-driven value gain should be considered public in the first place?",
    "What recapture rate preserves project feasibility while still creating visible social return?",
    "Which benefits should be prioritized first: infrastructure, affordability, tenant protection, or general revenue support?",
    "How should smaller builders and marginal projects be treated differently from large institutional actors?",
  ],
  maturity: "Seed topic",
  scorecard: [
    { label: "Novelty", value: 69 },
    { label: "Coherence", value: 82 },
    { label: "Feasibility", value: 55 },
    { label: "Evidence quality", value: 57 },
    { label: "Economic delta clarity", value: 52 },
    { label: "Public value", value: 84 },
  ],
  aiPanels: [
    {
      role: "Structurer",
      confidence: "Moderate",
      summary:
        "The topic makes a hidden housing question explicit: whether the gains created by public action should remain private by default or be shared through visible recapture rules.",
    },
    {
      role: "Steelman",
      confidence: "Moderate",
      summary:
        "A strong recapture design could make abundance more politically durable by ensuring growth funds the very infrastructure and protections that make growth livable.",
    },
    {
      role: "Critic",
      confidence: "Moderate",
      summary:
        "The model risks becoming a well-intentioned drag on supply if every public-benefit instinct is loaded onto the same projects that are already struggling to get built.",
    },
    {
      role: "Institutionalist",
      confidence: "Low",
      summary:
        "The idea is strongest when treated as a calibration problem inside broader housing reform, not as a moral tax lever that substitutes for production discipline.",
    },
  ],
  debatePrompts: [
    {
      title: "Support",
      description: "Add the strongest argument for why housing reform should visibly recapture some of the gains created by public action and legal capacity changes.",
    },
    {
      title: "Objection",
      description: "Surface the strongest reason recapture tools could suppress supply, distort projects, or become symbolic politics.",
    },
    {
      title: "Evidence",
      description: "Add cases, finance data, or policy comparisons that support or weaken land-value recapture as part of housing reform.",
    },
    {
      title: "Correction",
      description: "Identify conceptual, fiscal, or implementation errors in the current card.",
    },
    {
      title: "Nuance",
      description: "Improve the topic by exposing a missing tradeoff between fairness, feasibility, legitimacy, and production.",
    },
    {
      title: "Implementation concern",
      description: "Identify how fee design, governance, legal structure, or market conditions could quietly break the model in practice.",
    },
    {
      title: "Economic assumption challenge",
      description: "Question whether the legitimacy and public-benefit gains are large enough to justify the risk of weaker delivery.",
    },
    {
      title: "Alternate topic",
      description: "Offer a better way to share the gains of housing reform without creating the same project-friction and avoidance risks.",
    },
    {
      title: "Stakeholder perspective",
      description: "Add the likely view of a renter, landowner, builder, planner, or neighborhood resident living through this kind of recapture regime.",
    },
  ] satisfies DebatePrompt[],
  revisionHistory: [
    {
      version: "v0.1",
      date: "May 2026",
      note: "Initial seed topic card created to turn the value-capture question into a real inspectable housing object rather than leaving it as a side caveat to abundance.",
    },
    {
      version: "v0.2",
      date: "May 2026",
      note: "Supply-suppression and symbolic-benefit risks were raised to first-order visibility instead of being treated as downstream technical details.",
    },
    {
      version: "v0.3",
      date: "May 2026",
      note: "The card was sharpened around political durability, public-benefit legitimacy, and calibration so it reads as incentive design rather than generic anti-developer sentiment.",
    },
  ],
};

export const aiTopic001: TopicCardData = {
  id: "topic-001",
  title: "AI as Public Reasoning Infrastructure",
  subtitle:
    "A first AI room topic card for testing whether artificial intelligence can improve public reasoning instead of degrading it",
  draftNote:
    "This topic card is deliberately forward-looking and incomplete. It is meant to test whether AI can function as a civic reasoning layer rather than as a feed optimizer, persuasion engine, or hidden decision authority.",
  thesis:
    "AI should be built and governed as public reasoning infrastructure: a visible layer that helps people map claims, objections, evidence, incentives, and revisions in the open rather than optimizing attention, manipulation, or opaque authority.",
  currentRead:
    "This topic card feels strongest because it aims AI at one of the hardest public failures on the internet: reasoning that disappears into posts, feeds, and factional reaction. It feels weakest wherever it assumes a reasoning layer will remain transparent, uncaptured, and genuinely human-strengthening once institutions, platforms, and state actors start depending on it.",
  problemStatement:
    "Most public discourse systems are optimized for engagement, speed, and identity conflict rather than durable understanding. AI is increasingly used to summarize, rank, persuade, generate, and automate, but not to hold public questions, objections, revisions, and uncertainty in stable civic objects. Without a better structure, AI may scale noise, propaganda, dependence, and false consensus faster than it scales understanding.",
  proposedSolution:
    "Build AI-assisted issue rooms where claims, perspectives, evidence, objections, incentives, and revisions stay visible over time. Use AI to structure, compare, critique, summarize, and pressure-test the room, while humans retain perspective ownership, institutional accountability, and the power to challenge any provisional synthesis.",
  mechanism: [
    "Represent major public questions as stable room objects rather than transient posts or feed events.",
    "Separate attributable perspectives from a revisable synthesis so disagreement remains visible instead of being flattened into one answer or one vote result.",
    "Use AI roles to summarize, surface objections, compare proposals, detect duplication, expose assumptions, and point to missing evidence.",
    "Keep revision history, source visibility, and institutional labeling public so AI outputs can be contested rather than silently absorbed as authority.",
  ],
  benefits: [
    "Public reasoning becomes more durable, inspectable, and cumulative instead of dissolving into platform churn.",
    "Institutions can be examined through visible objections, incentives, and revisions rather than pure reputation warfare.",
    "AI upside is aimed at clarity, synthesis, and civic memory rather than only productivity or engagement.",
    "High-complexity public issues may become easier to navigate without pretending that disagreement disappears.",
  ],
  risks: [
    "A reasoning layer could become a polished legitimacy system for whoever controls the models, ranking logic, or synthesis rules.",
    "People may outsource judgment to the AI layer and treat fluent summaries as truth rather than as structured provisional reads.",
    "Powerful institutions could game public rooms by flooding them with formally valid but strategically distorting material.",
    "The system could improve discourse presentation without actually improving public wisdom, courage, or institutional accountability.",
  ],
  assumptions: [
    "Structured issue rooms can improve public reasoning enough to matter outside niche communities.",
    "AI critique and synthesis can be made more helpful than manipulative at the room level.",
    "Perspective ownership and synthesis governance can remain visibly contestable as the system scales.",
    "Institutions and contributors will accept slower, more inspectable reasoning workflows when stakes are high.",
  ],
  stakeholders: [
    "Citizens and readers",
    "Researchers and journalists",
    "Civic organizations and universities",
    "Governments and public agencies",
    "Platforms and AI labs",
    "Moderators and synthesis stewards",
    "Institutions subject to public review",
    "Future contributors building on prior rooms",
  ],
  evidence: [
    {
      title: "Structured argument and deliberation systems can improve clarity",
      status: "Strong evidence",
      note: "Prior systems suggest that visible structure helps reasoning, even if they do not solve incentive design or broad adoption by themselves.",
    },
    {
      title: "LLMs can summarize and compare large bodies of text quickly",
      status: "Strong evidence",
      note: "This supports the AI-assisted structuring case, though speed and fluency are not proof of civic reliability.",
    },
    {
      title: "AI already amplifies spam, deepfakes, and synthetic persuasion",
      status: "Strong evidence",
      note: "This is the clearest reason the room must treat truth and manipulation as first-order tests rather than side concerns.",
    },
    {
      title: "A public reasoning layer can resist institutional capture over time",
      status: "Needs verification",
      note: "This is central to the topic card and still largely hypothetical until real governance and usage evidence exists.",
    },
  ] satisfies EvidenceSummary[],
  economicDelta: {
    summary:
      "Estimated Economic Delta: Unknown but potentially large if a public reasoning layer reduces duplicated debate, policy confusion, review overhead, and institutional mistrust. Main costs include moderation, synthesis governance, model operations, evaluation, safety, and long-run anti-capture architecture. Confidence remains low until a real room shows better decisions or lower coordination waste.",
    metrics: [
      "Possible institutional savings: positive if review and synthesis costs fall meaningfully",
      "Implementation cost: moderate to high depending on governance and model architecture",
      "Adoption cost: potentially high because contributor behavior must change",
      "Public value: high if the system improves reasoning in contested domains",
      "Capture risk cost: high if governance is weak or incentives drift",
    ],
  },
  strongestSupport:
    "This topic card points AI at one of the few use cases where transparency and cumulative public memory can compound value instead of simply scaling persuasion, speed, or private advantage.",
  strongestObjection:
    "A system that claims to improve public reasoning can become even more dangerous than an ordinary feed if people mistake structured AI synthesis for neutral truth while power quietly shapes the room underneath it.",
  whatWouldStrengthen: [
    "A working pilot showing that structured AI-assisted rooms produce better questions, cleaner objections, and less duplicated argument than ordinary discussion systems.",
    "A visible governance model for who can shape synthesis, how it is challenged, and how institutional incentives are labeled.",
    "Evidence that contributors actually return because their input changes the room rather than disappearing into a polished interface.",
  ],
  openQuestions: [
    "Who should own and govern an AI public reasoning layer?",
    "How should synthesis be challenged when the model's read diverges from high-quality minority perspectives?",
    "What keeps structured rooms from becoming subtle legitimacy laundering for powerful institutions?",
    "Which first domains best demonstrate genuine civic value rather than intellectual spectacle?",
  ],
  maturity: "Seed topic",
  scorecard: [
    { label: "Novelty", value: 87 },
    { label: "Coherence", value: 79 },
    { label: "Feasibility", value: 46 },
    { label: "Evidence quality", value: 49 },
    { label: "Economic delta clarity", value: 52 },
    { label: "Public value", value: 91 },
  ],
  aiPanels: [
    {
      role: "Structurer",
      confidence: "Moderate",
      summary:
        "The topic successfully turns a broad ambition into a specific civic object: room structure, perspective ownership, synthesis governance, and anti-manipulation pressure all stay visible.",
    },
    {
      role: "Steelman",
      confidence: "Moderate",
      summary:
        "If AI can improve public reasoning at the room level, it may become one of the highest-value AI use cases because it strengthens decision quality across many domains rather than inside one workflow alone.",
    },
    {
      role: "Critic",
      confidence: "Moderate",
      summary:
        "The topic may underestimate how quickly reasoning infrastructure becomes authority infrastructure once institutions rely on it and ordinary users stop challenging fluent outputs.",
    },
    {
      role: "Civic theorist",
      confidence: "Low",
      summary:
        "The design is philosophically aligned with Civic Logos, but it still needs real governance and contributor psychology to avoid becoming a well-structured ideal without durable adoption.",
    },
  ],
  debatePrompts: [
    {
      title: "Support",
      description: "Add the strongest argument for why AI-assisted rooms could improve public reasoning more than existing platforms do.",
    },
    {
      title: "Objection",
      description: "Surface the strongest reason this topic could fail, centralize power, or create false authority.",
    },
    {
      title: "Evidence",
      description: "Add studies, systems, or case examples that support or weaken the public reasoning infrastructure claim.",
    },
    {
      title: "Correction",
      description: "Identify conceptual, definitional, or historical errors in the current card.",
    },
    {
      title: "Nuance",
      description: "Improve the topic by exposing a missing condition or tradeoff without rejecting the whole direction.",
    },
    {
      title: "Governance concern",
      description: "Identify how synthesis, moderation, incentives, or ownership could quietly distort the room.",
    },
    {
      title: "Economic assumption challenge",
      description: "Question whether the coordination and review savings are real enough to justify the overhead.",
    },
    {
      title: "Alternate topic",
      description: "Offer a better route for making AI net beneficial to civilization than building a public reasoning layer.",
    },
    {
      title: "Institutional perspective",
      description: "Add the view of a government, newsroom, university, or civic body that would have to live inside this system.",
    },
  ] satisfies DebatePrompt[],
  revisionHistory: [
    {
      version: "v0.1",
      date: "May 2026",
      note: "Initial seed topic card created to give the AI room its first concrete inspectable object rather than leaving the room entirely at the framing level.",
    },
    {
      version: "v0.2",
      date: "May 2026",
      note: "Capture risk and false-authority concerns were raised to first-order visibility inside the core objection set.",
    },
    {
      version: "v0.3",
      date: "May 2026",
      note: "Economic delta and contributor-return questions were made more explicit so the card does not hide behind philosophical appeal alone.",
    },
  ],
};

export const aiTopic002: TopicCardData = {
  id: "topic-002",
  title: "Synthetic Media Verification and Anti-Propaganda Layer",
  subtitle:
    "A second AI room topic card for keeping public truth-seeking viable in an age of cheap synthetic persuasion",
  draftNote:
    "This topic card is intentionally early because the verification problem is moving faster than public institutions are. It is meant to pressure one of the darkest AI failure modes directly: a world where persuasion, impersonation, and synthetic consensus become too cheap to distinguish from reality in time.",
  thesis:
    "If AI is going to be net good overall, civilization will likely need a visible verification and anti-propaganda layer that preserves provenance, challenge rights, and shared reality before synthetic media and personalized persuasion dissolve public trust.",
  currentRead:
    "This topic card feels strong because it names a concrete civilizational choke point: the public cannot reason well if identity, evidence, and media authenticity become too easy to spoof. It feels weak wherever it assumes technical provenance alone can restore trust, since propaganda is institutional and psychological as much as it is computational.",
  problemStatement:
    "AI systems can now generate persuasive text, images, audio, video, personas, and targeted narratives at low cost and high scale. That means the same systems that can educate or clarify can also produce deepfakes, fake consensus, automated astroturfing, imitation experts, and reality-distorting floods of synthetic content. Without public verification infrastructure, the epistemic environment may deteriorate faster than any individual fact-checking habit can compensate.",
  proposedSolution:
    "Build a layered public verification system: provenance standards, synthetic media labeling, challenge workflows, public dispute records, and room-level trust architecture that makes claims, media, and institutional assertions easier to examine before they become durable public belief.",
  mechanism: [
    "Require robust provenance and signing where feasible for institutional releases, public-interest communications, and high-impact synthetic media.",
    "Create public challenge paths where suspicious content can be contested, traced, and attached to visible review records instead of disappearing into platform churn.",
    "Use AI to assist verification triage, pattern detection, and cluster analysis while keeping final public judgment contestable and transparent.",
    "Integrate verification signals into issue rooms so claims, media artifacts, and institutional communications carry visible trust context rather than being consumed as isolated feed objects.",
  ],
  benefits: [
    "Helps preserve a usable public reality even as synthetic content becomes cheaper and more convincing.",
    "Makes AI governance less abstract by connecting it to visible trust, provenance, and public-memory infrastructure.",
    "Creates a clearer distinction between AI used for civic clarification and AI used for covert manipulation.",
    "Supports journalists, researchers, institutions, and ordinary readers who need challengeable authenticity signals rather than passive content warnings.",
  ],
  risks: [
    "Verification systems can drift into censorship, gatekeeping, or government-corporate control over what counts as legitimate speech.",
    "Bad actors may adapt quickly, using verification norms selectively while moving the real manipulation into gray zones, private channels, or compromised identities.",
    "The public may overtrust labeled or signed material even when the underlying claim is false, incomplete, or strategically framed.",
    "Smaller publishers, dissidents, or privacy-sensitive actors may be harmed if verification expectations become too expensive or identity-heavy.",
  ],
  assumptions: [
    "Shared reality can be strengthened by better provenance, challenge systems, and public verification habits rather than only by content moderation alone.",
    "Institutions will adopt some verification norms if the cost of unverified communication becomes reputationally or operationally high enough.",
    "Readers can learn to distinguish authenticity signals from truth claims, so provenance improves judgment without becoming a fake oracle.",
    "AI-assisted verification can scale faster than purely manual review without simply becoming another opaque authority layer.",
  ],
  stakeholders: [
    "Citizens and readers",
    "Journalists and fact-checkers",
    "Platforms and model providers",
    "Governments and election administrators",
    "Researchers and verification labs",
    "Whistleblowers and dissidents",
    "Creators and public institutions",
    "Communities targeted by propaganda operations",
  ],
  evidence: [
    {
      title: "Synthetic media quality and volume are increasing quickly",
      status: "Strong evidence",
      note: "Supports the claim that authenticity friction is collapsing and that manual detection habits will weaken over time.",
    },
    {
      title: "Existing content-labeling and provenance tools are unevenly adopted",
      status: "Useful but incomplete",
      note: "Shows there are partial building blocks, but no stable public trust layer yet.",
    },
    {
      title: "Coordinated propaganda already exploits speed, scale, and ambiguity",
      status: "Strong evidence",
      note: "Suggests AI will magnify existing manipulation dynamics rather than inventing them from scratch.",
    },
    {
      title: "Verification signals can improve trust without overcentralizing power",
      status: "Needs verification",
      note: "This remains the hardest assumption because governance and adoption matter as much as the technical signal itself.",
    },
  ] satisfies EvidenceSummary[],
  economicDelta: {
    summary:
      "Estimated Economic Delta: Indirect but potentially large if better verification reduces fraud, panic, reputational warfare, legal churn, institutional mistrust, and coordination breakdown. Main costs include standards work, infrastructure, review capacity, adversarial adaptation, and governance. Confidence remains low because the value is partly preventive and partly tied to avoiding civilizational downside rather than generating obvious short-term revenue.",
    metrics: [
      "Possible societal savings: high if verification reduces large-scale misinformation and fraud costs",
      "Implementation cost: moderate to high because infrastructure and governance must move together",
      "Adoption cost: high if institutions and platforms resist common standards",
      "Public value: very high if shared reality remains more challengeable and legible",
      "Centralization risk cost: high if verification becomes speech control by another name",
    ],
  },
  strongestSupport:
    "This topic card addresses one of the clearest conditions under which AI becomes bad overall: when synthetic persuasion scales faster than public verification. If that asymmetry is not corrected, many other AI upsides may arrive inside a degraded epistemic environment.",
  strongestObjection:
    "A verification layer can easily harden into a legitimacy layer for powerful institutions, where signed, labeled, and authenticated content is treated as socially real while outsider speech, anonymity, and dissent become easier to dismiss or suppress.",
  whatWouldStrengthen: [
    "A clearer governance distinction between authenticity signals, truth claims, moderation powers, and dissent protections.",
    "A room-level pilot showing how provenance, challenge, and correction records can work without collapsing into bureaucratic friction or trust theater.",
    "Evidence that verification infrastructure reduces manipulation meaningfully in practice rather than simply adding labels most people ignore.",
  ],
  openQuestions: [
    "Who should operate verification infrastructure without turning it into a censorship or monopoly tool?",
    "How should anonymity, whistleblowing, and dissident speech be protected inside a stronger provenance regime?",
    "Which claims or media types deserve the strongest verification expectations first?",
    "Can public challenge systems keep up with the speed and scale of synthetic persuasion at all?",
  ],
  maturity: "Seed topic",
  scorecard: [
    { label: "Novelty", value: 78 },
    { label: "Coherence", value: 83 },
    { label: "Feasibility", value: 51 },
    { label: "Evidence quality", value: 58 },
    { label: "Economic delta clarity", value: 47 },
    { label: "Public value", value: 94 },
  ],
  aiPanels: [
    {
      role: "Structurer",
      confidence: "Moderate",
      summary:
        "The topic successfully turns the truth-versus-propaganda frame into a specific infrastructure problem: provenance, challenge, trust context, and governance are all visible rather than implied.",
    },
    {
      role: "Steelman",
      confidence: "Moderate",
      summary:
        "If shared reality fails, many other AI benefits become politically or civically unusable. That makes verification a precondition topic rather than a side concern.",
    },
    {
      role: "Critic",
      confidence: "Moderate",
      summary:
        "The design risks building a subtle authority hierarchy in which authenticated or institutional speech gains legitimacy while anonymous, weakly signed, or outsider speech becomes culturally discounted.",
    },
    {
      role: "Civic theorist",
      confidence: "Low",
      summary:
        "The topic fits Civic Logos well because it keeps truth-seeking challengeable instead of pretending labels solve epistemology. But it still needs a sharper freedom-versus-control theory.",
    },
  ],
  debatePrompts: [
    {
      title: "Support",
      description: "Add the strongest argument for why verification infrastructure is a precondition for AI being net good overall.",
    },
    {
      title: "Objection",
      description: "Surface the strongest reason this topic could become censorship, gatekeeping, or institutional legitimacy laundering.",
    },
    {
      title: "Evidence",
      description: "Add cases, standards, or research that support or weaken the practical value of provenance, labeling, and challenge systems.",
    },
    {
      title: "Correction",
      description: "Identify technical, civil-liberties, or governance errors in the current card.",
    },
    {
      title: "Nuance",
      description: "Improve the topic by exposing a missing tradeoff between verification, freedom, anonymity, and institutional trust.",
    },
    {
      title: "Governance concern",
      description: "Identify how the verification layer could centralize narrative power even if its formal goal is only authenticity and challengeability.",
    },
    {
      title: "Economic assumption challenge",
      description: "Question whether preventive trust infrastructure creates enough visible value for institutions and the public to adopt it seriously.",
    },
    {
      title: "Alternate topic",
      description: "Offer a better way to preserve public truth-seeking under AI pressure than building a verification and anti-propaganda layer.",
    },
    {
      title: "Civil-liberties perspective",
      description: "Add the view of a privacy advocate, dissident, or whistleblower worried that verification infrastructure becomes soft control.",
    },
  ] satisfies DebatePrompt[],
  revisionHistory: [
    {
      version: "v0.1",
      date: "May 2026",
      note: "Initial seed topic card created to turn the truth and propaganda frame into a concrete inspectable object inside the AI room.",
    },
    {
      version: "v0.2",
      date: "May 2026",
      note: "Centralization, censorship, and outsider-speech risks were raised to first-order visibility rather than treated as implementation details.",
    },
    {
      version: "v0.3",
      date: "May 2026",
      note: "The card was sharpened around provenance, challenge rights, and the distinction between authenticity signals and truth claims.",
    },
  ],
};

export const institutionalTrustTopic001: TopicCardData = {
  id: "topic-001",
  title: "Public Review Stake for Institutional Claims",
  subtitle:
    "A first institutional-trust topic card for making scrutiny fundable without letting money buy legitimacy",
  draftNote:
    "This topic card is intentionally unfinished because it sits close to the economic and civic core of Civic Logos. It is meant to test whether examination itself can be funded in public without collapsing into sponsorship, pay-to-play legitimacy, or institutional capture.",
  thesis:
    "High-impact institutional claims should be able to trigger a public review stake: funding that pays for structured examination, evidence work, synthesis labor, and challenge processes without giving the payer authority over the conclusion.",
  currentRead:
    "This topic card feels strongest because it inverts a standard internet incentive. Instead of money buying amplification or friendly treatment, money buys examination. It feels weakest wherever enforcement, governance, and neutrality are assumed rather than designed. If the payer can shape the process or if public readers cannot see the constraints clearly, the mechanism becomes just another laundering layer.",
  problemStatement:
    "Major institutions already spend heavily on messaging, lobbying, PR, legal positioning, and narrative management, but there is very little durable public infrastructure for forcing high-impact claims into structured scrutiny. As a result, institutions can often outspend criticism, hide behind complexity, or flood the information space without paying for the civic labor needed to examine what they say and do.",
  proposedSolution:
    "Create a mechanism where important institutional claims, reforms, spending proposals, or disputed public assertions can be attached to a visible review stake. That stake funds evidence gathering, structured objections, synthesis work, and public review capacity while the conclusions remain contestable, attributable, and independent of the funder.",
  mechanism: [
    "Define which kinds of institutional claims, policies, or public assertions are eligible or required to enter a review-stake process.",
    "Route stake funding into visible review work such as evidence gathering, adversarial critique, synthesis drafting, and correction tracking instead of into promotional placement.",
    "Separate funding from judgment by making perspectives attributable, synthesis contestable, and reviewer roles transparent.",
    "Publish revision history, conflicts, funding relationships, and strongest objections so the public can examine both the claim and the review process itself.",
  ],
  benefits: [
    "Money is redirected toward scrutiny rather than attention capture or favorable narrative placement.",
    "Institutions with real stakes in public questions help fund the civic labor required to examine them.",
    "Readers gain a clearer record of evidence, objections, revisions, and incentives instead of just competing messaging.",
    "Civic Logos gets a plausible institutional revenue path that is structurally aligned with its epistemic goals.",
  ],
  risks: [
    "Powerful actors may still find subtle ways to shape scope, framing, reviewer selection, or timing even if they cannot directly buy conclusions.",
    "The public may confuse a funded review with a truthful result, giving the mechanism undeserved authority.",
    "Review labor could become procedural theater if the outputs are visible but not meaningfully adversarial or independent.",
    "Smaller institutions or grassroots groups may be disadvantaged if review stakes become too expensive or culturally mandatory.",
  ],
  assumptions: [
    "Institutions will sometimes accept scrutiny if the process is legible, prestigious enough, or normatively expected.",
    "A review process can be governed tightly enough that funders do not quietly capture conclusions.",
    "Readers will understand the difference between funded examination and purchased legitimacy.",
    "There is enough real civic demand for structured review outputs to justify the overhead.",
  ],
  stakeholders: [
    "Citizens and readers",
    "Government agencies",
    "Corporations and trade groups",
    "Universities and nonprofits",
    "Journalists and researchers",
    "Reviewers and synthesis workers",
    "Whistleblowers and critics",
    "Communities affected by high-impact claims",
  ],
  evidence: [
    {
      title: "Institutions already spend heavily on influence and narrative management",
      status: "Strong evidence",
      note: "Supports the basic premise that public reasoning is currently underfunded relative to persuasion infrastructure.",
    },
    {
      title: "Independent review and audit mechanisms can improve trust when they remain visible and adversarial",
      status: "Useful but uneven",
      note: "Suggests the model can work in principle, though outcomes vary a lot by governance quality.",
    },
    {
      title: "Sponsored research and funded oversight are vulnerable to subtle capture",
      status: "Strong evidence",
      note: "This is the clearest warning that the stake mechanism has to separate funding from judgment very carefully.",
    },
    {
      title: "A public review stake can become a durable institutional norm",
      status: "Needs verification",
      note: "The model is plausible but still mostly hypothetical without live adoption and repeated use.",
    },
  ] satisfies EvidenceSummary[],
  economicDelta: {
    summary:
      "Estimated Economic Delta: Unknown but potentially meaningful if structured review reduces bad policy, institutional waste, legal churn, reputational distortion, and duplicated public confusion. Main costs include staffing review capacity, synthesis governance, anti-capture controls, and slower throughput. Confidence remains low until real pilots show whether funded scrutiny is cheaper than unmanaged distrust and messaging warfare.",
    metrics: [
      "Possible public value: high if scrutiny quality genuinely improves",
      "Implementation cost: moderate to high because governance is the hard part",
      "Institutional willingness-to-pay: uncertain but strategically important",
      "Revenue alignment: unusually strong if conclusions remain independent",
      "Capture risk cost: high if the review process becomes prestige theater",
    ],
  },
  strongestSupport:
    "This topic captures one of Civic Logos's most original ideas: money should fund examination, not authority. If that mechanism works, it creates both epistemic value and a business model that does not depend on attention extraction.",
  strongestObjection:
    "Any system that takes money from institutions to examine institutions risks becoming an elegant compromise formation where scrutiny is visible enough to reassure the public but controlled enough not to threaten power seriously.",
  whatWouldStrengthen: [
    "A concrete pilot structure showing who pays, who reviews, what becomes public, and how conflicts are disclosed.",
    "A clearer governance rule set for reviewer independence, funder constraints, challenge rights, and revision procedures.",
    "Examples from adjacent domains showing where funded scrutiny improved trust instead of becoming procedural theater.",
  ],
  openQuestions: [
    "Which kinds of claims should qualify for or require a review stake?",
    "How should smaller institutions or public-interest groups participate without being priced out?",
    "Who decides whether a review has been adequately adversarial and complete?",
    "What stops the process from becoming a prestige shield for sophisticated institutions?",
  ],
  maturity: "Seed topic",
  scorecard: [
    { label: "Novelty", value: 91 },
    { label: "Coherence", value: 82 },
    { label: "Feasibility", value: 44 },
    { label: "Evidence quality", value: 46 },
    { label: "Economic delta clarity", value: 63 },
    { label: "Public value", value: 89 },
  ],
  aiPanels: [
    {
      role: "Structurer",
      confidence: "Moderate",
      summary:
        "The topic successfully converts a philosophical slogan into a mechanism: funding source, review labor, independence constraints, and public memory are all on the table.",
    },
    {
      role: "Steelman",
      confidence: "Moderate",
      summary:
        "If this works, it creates one of the rare monetization models where power pays to be examined instead of paying to dominate attention.",
    },
    {
      role: "Critic",
      confidence: "Moderate",
      summary:
        "The mechanism could easily become a legitimacy service for sophisticated institutions unless review independence, challenge rights, and public transparency are exceptionally strong.",
    },
    {
      role: "Institutionalist",
      confidence: "Low",
      summary:
        "The idea is strategically important, but it still needs a credible adoption path showing why real institutions would submit to this process instead of staying inside existing PR, legal, and media channels.",
    },
  ],
  debatePrompts: [
    {
      title: "Support",
      description: "Add the best argument for why funded scrutiny could improve trust more than current PR, audit, or media systems do.",
    },
    {
      title: "Objection",
      description: "Surface the strongest reason this mechanism could become capture theater or a prestige shield.",
    },
    {
      title: "Evidence",
      description: "Add examples from auditing, journalism, oversight, procurement, or regulation that support or weaken the design.",
    },
    {
      title: "Correction",
      description: "Identify conceptual, financial, or governance errors in the current card.",
    },
    {
      title: "Nuance",
      description: "Improve the topic by exposing a missing condition or tradeoff without discarding the mechanism.",
    },
    {
      title: "Governance concern",
      description: "Identify how reviewer selection, process design, or funder influence could quietly distort the outcome.",
    },
    {
      title: "Economic assumption challenge",
      description: "Question whether institutions would actually fund this process at meaningful scale and whether the value is legible enough to sustain it.",
    },
    {
      title: "Alternate topic",
      description: "Offer a better way to make public examination durable and fundable without introducing the same capture risk.",
    },
    {
      title: "Institutional perspective",
      description: "Add the likely view of a city, university, corporation, newsroom, or regulator asked to participate in a review-stake process.",
    },
  ] satisfies DebatePrompt[],
  revisionHistory: [
    {
      version: "v0.1",
      date: "May 2026",
      note: "Initial seed topic card created to turn the 'money funds examination, not authority' idea into a real inspectable object inside the trust room.",
    },
    {
      version: "v0.2",
      date: "May 2026",
      note: "Capture and prestige-laundering risks were raised to first-order visibility rather than left as side concerns.",
    },
    {
      version: "v0.3",
      date: "May 2026",
      note: "Adoption and reviewer-governance questions were made more explicit so the card does not rely on moral elegance alone.",
    },
  ],
};

export const institutionalTrustTopic002: TopicCardData = {
  id: "topic-002",
  title: "Radical Disclosure and Conflict Mapping Model",
  subtitle:
    "A second institutional-trust topic card for making incentives, affiliations, and correction history legible before trust claims harden",
  draftNote:
    "This topic card is intentionally early because disclosure can easily become either a fetish or a fig leaf. It is meant to test a narrower claim: public trust improves when institutional speech carries visible incentive context and correction memory, but only if that visibility is actually interpretable and hard to launder.",
  thesis:
    "Institutional speech, claims, and public-facing outputs should carry visible conflict mapping: affiliations, funding relationships, relevant incentives, correction history, and role context, so trust is earned through legibility rather than assumed through brand or credential alone.",
  currentRead:
    "This topic card feels strongest because it attacks one of the cleanest trust failures directly: people are routinely asked to evaluate institutional claims without seeing the incentive landscape around them. It feels weakest wherever disclosure is treated as sufficient by itself, since a flood of raw disclosures can obscure as much as it clarifies if there is no structure for interpretation.",
  problemStatement:
    "Institutions often speak into public life through reports, media appearances, lobbying, research, public statements, nonprofit advocacy, and expert commentary without ordinary readers being able to see the relevant affiliations, financial incentives, strategic interests, prior corrections, or adjacent conflicts that shape the message. As a result, people either overtrust institutional speech by default or overcorrect into blanket suspicion.",
  proposedSolution:
    "Create a disclosure and conflict-mapping layer where institutional speech is paired with visible affiliation context, funding relationships, relevant incentives, correction history, and role labels. The goal is not to tell readers what to think, but to make incentive structure legible enough that trust and skepticism can become more proportional.",
  mechanism: [
    "Define the core disclosure objects that matter most in public reasoning: funding, role, institutional affiliation, prior correction history, relevant incentives, and domain-specific trust context.",
    "Attach those objects visibly to high-impact institutional claims, publications, public statements, and room contributions rather than burying them in legal fine print or separate databases.",
    "Use conflict maps and correction ledgers to show relationships and history in structured form so readers can interpret disclosure instead of drowning in document dumps.",
    "Allow challenges, corrections, and updates so disclosure itself becomes a revisable public object rather than a one-time compliance artifact.",
  ],
  benefits: [
    "Readers gain a clearer basis for proportional trust instead of being forced into naive deference or generalized cynicism.",
    "Institutions that behave responsibly can make their correction practices and incentive boundaries more visible over time.",
    "Civic Logos gets a concrete mechanism for the paper's idea that institutional speech should be labeled, attributable, and pressure-testable.",
    "Disclosure becomes more useful as public reasoning infrastructure rather than a static compliance exercise.",
  ],
  risks: [
    "Disclosure overload can create the illusion of transparency while making the real power structure even harder to interpret.",
    "Sophisticated institutions may optimize for performative compliance, disclosing technically while still hiding the most important strategic relationships.",
    "Readers may misuse conflict signals as automatic dismissal, flattening substantive disagreement into motive hunting.",
    "Heavy disclosure regimes can burden smaller institutions, independent researchers, or dissident actors more than large professionalized organizations.",
  ],
  assumptions: [
    "A better visibility layer around incentives and corrections can improve trust without collapsing into pure cynicism or suspicion theater.",
    "The most decision-relevant disclosures can be identified and surfaced without turning every public statement into unusable bureaucracy.",
    "Readers can learn to use conflict context as an interpretive aid rather than as a substitute for substantive reasoning.",
    "Institutions will tolerate stronger legibility norms if they become culturally expected or structurally tied to public credibility.",
  ],
  stakeholders: [
    "Citizens and readers",
    "Journalists and editors",
    "Researchers and experts",
    "Government agencies and public officials",
    "Corporations, nonprofits, and trade groups",
    "Whistleblowers and watchdogs",
    "Platforms and public-information intermediaries",
    "Smaller institutions with limited compliance capacity",
  ],
  evidence: [
    {
      title: "Conflict-of-interest and funding disclosures can change how claims are interpreted",
      status: "Strong evidence",
      note: "Supports the idea that incentive context matters materially for public judgment.",
    },
    {
      title: "Disclosure systems often become formalistic and hard for ordinary readers to use",
      status: "Strong evidence",
      note: "This is the clearest warning that structured interpretation matters as much as the raw disclosure itself.",
    },
    {
      title: "Public correction practices affect long-run institutional trust",
      status: "Useful but uneven",
      note: "Suggests memory and correction history are part of trust, not just current messaging.",
    },
    {
      title: "Conflict mapping can improve public reasoning without encouraging blanket motive reduction",
      status: "Needs verification",
      note: "This is central to the card and still partly aspirational until the design is tested in live rooms.",
    },
  ] satisfies EvidenceSummary[],
  economicDelta: {
    summary:
      "Estimated Economic Delta: Indirect but potentially meaningful if clearer disclosure reduces fraud, reputational distortion, bad procurement, captured expertise, and duplicated public confusion. Main costs include compliance burden, mapping infrastructure, governance, challenge handling, and interface design that keeps disclosures interpretable. Confidence remains moderate-to-low because value depends on whether readers actually use the structure well.",
    metrics: [
      "Possible trust-value gain: high if disclosure becomes meaningfully legible",
      "Implementation cost: moderate because the hard part is interpretation design, not just data collection",
      "Institutional resistance: likely high where disclosure threatens narrative control",
      "Compliance burden: moderate with risk of uneven impact on smaller actors",
      "Public value: high if conflict and correction context become easier to reason over",
    ],
  },
  strongestSupport:
    "This topic card gives Civic Logos a concrete way to operationalize one of its central claims: institutional speech should not arrive as disembodied authority. It should arrive with visible context about incentives, affiliations, and correction history.",
  strongestObjection:
    "Disclosure regimes often produce ritual transparency without real clarity. If the system mainly teaches people to sniff for motives while sophisticated institutions continue shaping the frame, the result may be cynicism theater rather than better trust.",
  whatWouldStrengthen: [
    "A sharper model for which disclosures matter most in different domains so the card avoids one-size-fits-all transparency clutter.",
    "A live example showing how correction history and conflict mapping could be presented in a genuinely legible interface.",
    "Better distinction between useful motive context and lazy motive dismissal so the system does not reward reductionism.",
  ],
  openQuestions: [
    "Which conflicts, affiliations, and incentives are most decision-relevant in public-facing institutional speech?",
    "How can disclosure stay readable and comparable instead of becoming legal boilerplate or data exhaust?",
    "What protections should exist for smaller actors, whistleblowers, or dissidents who cannot comply like major institutions can?",
    "How should correction history affect trust without making honest revision look like weakness?",
  ],
  maturity: "Seed topic",
  scorecard: [
    { label: "Novelty", value: 76 },
    { label: "Coherence", value: 85 },
    { label: "Feasibility", value: 59 },
    { label: "Evidence quality", value: 63 },
    { label: "Economic delta clarity", value: 54 },
    { label: "Public value", value: 88 },
  ],
  aiPanels: [
    {
      role: "Structurer",
      confidence: "Moderate",
      summary:
        "The topic card successfully converts abstract transparency talk into a specific visibility layer: conflicts, incentives, correction history, and interpretation design all stay in view.",
    },
    {
      role: "Steelman",
      confidence: "Moderate",
      summary:
        "If institutional speech carried better conflict and correction context, public trust could become more proportional and less dependent on blind brand deference or generalized suspicion.",
    },
    {
      role: "Critic",
      confidence: "Moderate",
      summary:
        "The model could still reward surface transparency while leaving deeper agenda setting and informal influence mostly untouched, especially for sophisticated institutions.",
    },
    {
      role: "Institutionalist",
      confidence: "Low",
      summary:
        "The design is promising, but the real test is whether it helps readers interpret institutions better instead of simply increasing disclosure volume and compliance theater.",
    },
  ],
  debatePrompts: [
    {
      title: "Support",
      description: "Add the strongest argument for why visible conflict mapping and correction history would improve trust more than current disclosure norms do.",
    },
    {
      title: "Objection",
      description: "Surface the strongest reason this model could become transparency theater, motive reductionism, or unequal compliance burden.",
    },
    {
      title: "Evidence",
      description: "Add examples, studies, or systems that support or weaken structured disclosure as a trust-repair mechanism.",
    },
    {
      title: "Correction",
      description: "Identify conceptual, governance, or interface-design errors in the current card.",
    },
    {
      title: "Nuance",
      description: "Improve the topic by exposing a missing tradeoff between legibility, fairness, anonymity, and institutional burden.",
    },
    {
      title: "Implementation concern",
      description: "Identify how institutions could comply performatively while still obscuring the most important strategic relationships.",
    },
    {
      title: "Economic assumption challenge",
      description: "Question whether the trust and anti-corruption value created by structured disclosure is large enough to justify the overhead.",
    },
    {
      title: "Alternate topic",
      description: "Offer a better way to make institutional speech legible without creating disclosure clutter or motive-hunting pathologies.",
    },
    {
      title: "Reader perspective",
      description: "Add the view of an ordinary reader, journalist, whistleblower, or small institution trying to use or survive this disclosure layer.",
    },
  ] satisfies DebatePrompt[],
  revisionHistory: [
    {
      version: "v0.1",
      date: "May 2026",
      note: "Initial seed topic card created to turn disclosure and conflict legibility into a real inspectable object inside the trust room.",
    },
    {
      version: "v0.2",
      date: "May 2026",
      note: "Disclosure overload, performative compliance, and motive-hunting risks were raised to first-order visibility rather than treated as minor caveats.",
    },
    {
      version: "v0.3",
      date: "May 2026",
      note: "The card was sharpened around incentive context, correction memory, and interpretability so it reads as public reasoning infrastructure rather than generic transparency rhetoric.",
    },
  ],
};

export const roomTopicCards = {
  healthcare: [topic001, topic002, topic003],
  governance: [governanceTopic001, governanceTopic002],
  housing: [housingTopic001, housingTopic002],
  "ai-labor": [aiTopic001, aiTopic002],
  "institutional-trust": [institutionalTrustTopic001, institutionalTrustTopic002],
} satisfies Record<IssueRoomSlug, readonly TopicCardData[]>;

export function getRoomTopicCards(roomSlug: IssueRoomSlug): readonly TopicCardData[] {
  return roomTopicCards[roomSlug];
}

export function getRoomTopicCard(
  roomSlug: IssueRoomSlug,
  topicId: string,
): TopicCardData | undefined {
  return roomTopicCards[roomSlug].find((card) => card.id === topicId);
}

export function getRoomHref(roomSlug: IssueRoomSlug): string {
  return roomSlug === "healthcare" ? "/healthcare" : `/rooms/${roomSlug}`;
}

export function getRoomTopicHref(
  roomSlug: IssueRoomSlug,
  topicId: string,
): string {
  return `${getRoomHref(roomSlug)}/${topicId}`;
}

export function getRoomTopicBrandSubtitle(roomSlug: IssueRoomSlug): string {
  switch (roomSlug) {
    case "healthcare":
      return "Healthcare topic card";
    case "governance":
      return "Governance topic card";
    case "housing":
      return "Housing topic card";
    case "ai-labor":
      return "AI topic card";
    case "institutional-trust":
      return "Institutional trust topic card";
  }
}

export function getRoomTopicLabel(roomSlug: IssueRoomSlug): string {
  switch (roomSlug) {
    case "healthcare":
      return "Healthcare room";
    case "governance":
      return "Governance room";
    case "housing":
      return "Housing room";
    case "ai-labor":
      return "AI room";
    case "institutional-trust":
      return "Trust room";
  }
}
