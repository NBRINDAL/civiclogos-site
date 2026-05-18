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

export const issueRoomQuestion =
  "What healthcare system best balances cost, access, quality, freedom, innovation, and public health?";

export const healthcareIssueRoom = {
  title: "Healthcare Reform",
  question: issueRoomQuestion,
  draftNote:
    "This room is an early working draft. The goal is not to look complete yet, but to make the first public synthesis legible enough that people can improve it.",
  whyItMatters:
    "Healthcare is a strong first issue because it touches cost, access, innovation, insurance, public spending, personal suffering, institutional interests, and economic-delta analysis.",
  currentSynthesis:
    "Healthcare reform requires balancing cost, access, quality, administrative complexity, innovation, provider stability, patient choice, public health, and implementation feasibility. The main proposals differ less in their stated goals than in how they allocate responsibility among government, employers, insurers, providers, and individuals. The largest unresolved questions remain transition cost, administrative savings, rural access, provider reimbursement, pharmaceutical pricing, patient choice, and long-term economic delta.",
  narrative: [
    "The first job of the healthcare room is not to declare a winner. It is to show the public what a serious Civic Logos issue room looks like when one question is forced into visible structure instead of dissolving into feeds, tribes, and disconnected hot takes.",
    "That means keeping the current synthesis, major proposal families, evidence, objections, stakeholder tradeoffs, and open questions visible at the same time. Even in an unfinished state, the room should let someone understand what is being argued, where the disagreement really lives, and what would have to change for the synthesis to move.",
  ],
  workingConclusions: [
    "The hardest healthcare disagreements are usually not about values alone, but about where cost, administrative burden, innovation incentives, and access bottlenecks actually sit inside the system.",
    "A first useful prototype should narrow the field enough to compare models honestly without pretending the uncertainty is gone.",
    "Economic delta matters, but only if the assumptions, transition costs, and distribution of pain are made visible rather than buried in a slogan.",
  ],
  whatCouldMoveTheRoom: [
    "A credible pilot or case study showing administrative savings that survive implementation reality.",
    "Better evidence on rural access and provider stability under competing reform models.",
    "Clearer household-level impact modeling, especially for debt, delay of care, and insurance churn.",
  ],
  roomComponents: [
    "Current living synthesis",
    "Major proposals",
    "Economic delta models",
    "Stakeholders",
    "Evidence library",
    "Public perspectives",
    "Institutional perspectives",
    "Open questions",
  ],
  topProposals: [
    {
      title: "Proposal 001: Administrative Simplification and AI-Assisted Triage",
      summary:
        "A seed proposal focused on reducing administrative overhead, standardizing claims flows, and using AI-guided intake to improve access and redirect savings toward care.",
      label: "Top proposal",
      metric: "Best first demonstration of the idea-card process",
      href: "/healthcare/proposal-001",
    },
    {
      title: "Public Option Model",
      summary:
        "Adds a public insurance option while preserving private insurance, aiming for competitive pressure without full system replacement.",
      label: "Core proposal",
      metric: "Moderate implementation disruption",
    },
    {
      title: "Single-Payer Model",
      summary:
        "Consolidates coverage and financing under a public framework, with potential administrative savings and major transition demands.",
      label: "Core proposal",
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
} as const;

export const proposal001 = {
  id: "proposal-001",
  title: "Administrative Simplification and AI-Assisted Triage",
  subtitle: "An initial healthcare reform proposal submitted for public reasoning",
  draftNote:
    "This idea card is intentionally unfinished. It is meant to demonstrate how a proposal becomes inspectable, criticizable, and revisable in public before the evidence picture is complete.",
  thesis:
    "The United States can reduce healthcare cost and access friction by standardizing administrative flows, using AI-assisted intake and triage for low-risk routing, and reinvesting verified savings into primary and preventive care.",
  currentRead:
    "The proposal feels strongest as a first prototype because it targets real friction without requiring the room to settle the entire healthcare ideology war in one move. It feels weakest wherever advocates implicitly assume that administrative savings will be large, durable, and easy to redirect. The card is useful right now because both of those things can be made explicit.",
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
    "This proposal is a credible first test because it targets a widely acknowledged source of waste without requiring the platform to pretend that one financing ideology has already won the healthcare debate.",
  strongestObjection:
    "The proposal risks mistaking administrative optimization for system reform; if pricing power, reimbursement dynamics, and uneven provider capacity remain intact, the savings may disappoint while the implementation burden still lands.",
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
  maturity: "Seed proposal",
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
        "The strongest case is that the proposal attacks real waste, improves access friction, and gives the healthcare room a measurable first demonstration without forcing premature ideological closure.",
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
      description: "Add the best argument for why this proposal might work better than existing structures.",
    },
    {
      title: "Objection",
      description: "Surface the strongest reason this proposal could fail or misfire.",
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
      description: "Improve the proposal by exposing a missing condition or tradeoff without fully rejecting it.",
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
      title: "Alternate proposal",
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
      note: "Initial seed proposal created to demonstrate the full Idea Card anatomy inside the healthcare room.",
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
