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
      href: "/healthcare/proposal-001",
    },
    {
      title: "Public Option Model",
      summary:
        "Adds a public insurance option while preserving private insurance, aiming for competitive pressure without full system replacement.",
      label: "Core topic",
      metric: "Moderate implementation disruption",
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
      href: "/healthcare/proposal-001",
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
      title: "Employer-Based Reform",
      summary:
        "Builds on existing coverage structures, but raises questions about labor mobility, fragmentation, and whether incrementalism can solve structural cost pressure.",
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
      title: "Aligned Augmentation Model",
      summary:
        "Treats AI as a tool for amplifying human capability while keeping humans inside judgment, accountability, and mission-critical loops.",
      label: "Topic in focus",
      metric: "Strong upside case, governance-dependent",
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

export const proposal001 = {
  id: "proposal-001",
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
} as const;
