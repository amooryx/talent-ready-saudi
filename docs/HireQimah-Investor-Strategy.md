# HireQimah — Monetization, Partnership & Go-To-Market Strategy

**Document Classification:** Board-Level Strategic Brief  
**Version:** 1.0 — Pre-Revenue / Concept Stage  
**Date:** February 2026  
**Prepared for:** Investors, University Partners, HR Directors, Saudi Accelerators

---

## Executive Summary

HireQimah is a verified Employment Readiness Scoring (ERS) platform purpose-built for the Saudi Arabian talent ecosystem. It bridges the structural gap between university output and employer expectations by providing a standardized, transparent, and data-driven readiness framework for Saudi students.

**Current status:** Early-stage MVP prototype. No signed partnerships. No revenue. Founder-led.

**Opportunity:** Saudi Arabia's Vision 2030 mandates aggressive Saudization targets. Employers struggle to identify job-ready Saudi graduates. Universities lack tools to demonstrate graduate employability. Students lack clarity on market requirements. HireQimah addresses all three simultaneously.

**Recommended early monetization:** Freemium model for students + subscription for HR, with success-based fees introduced at scale.

**Long-term positioning:** National employment readiness infrastructure — the verified standard for Saudi graduate assessment.

---

## 1. Deep Monetization Model Comparison

### A. Pay-Per-Hire Model

| Dimension | Assessment |
|---|---|
| Revenue Predictability | Low — revenue is event-driven, unpredictable |
| Risk Profile | High — zero revenue until placements occur |
| HR Adoption Difficulty | Low barrier — no upfront commitment |
| Scalability | Moderate — scales with hiring volume |
| Saudi Market Fit | Weak for early stage — Saudi HR cycles are seasonal and slow |

### B. Subscription-Only Model

| Dimension | Assessment |
|---|---|
| Revenue Predictability | High — recurring monthly/annual revenue |
| Risk Profile | Moderate — requires demonstrating ongoing value |
| HR Adoption Difficulty | Moderate — requires budget commitment |
| Scalability | High — predictable growth curves |
| Saudi Market Fit | Strong — enterprise procurement prefers fixed contracts |

### C. Hybrid Model (Subscription + Success Fee)

| Dimension | Assessment |
|---|---|
| Revenue Predictability | High base + variable upside |
| Risk Profile | Low — diversified revenue streams |
| HR Adoption Difficulty | Moderate — requires explaining dual pricing |
| Scalability | Very High — aligns incentives with outcomes |
| Saudi Market Fit | Optimal at national scale |

### D. Student Freemium + Premium

| Dimension | Assessment |
|---|---|
| Revenue Predictability | Low initially — depends on conversion rate |
| Risk Profile | Low — minimal cost to acquire users |
| HR Adoption Difficulty | N/A (student-facing) |
| Scalability | Very High — viral potential within universities |
| Saudi Market Fit | Strong — Saudi students are digitally active and mobile-first |

---

## 2. Recommended Model by Growth Stage

### Stage 1: Prototype (0–6 Months)

**Model:** 100% Free for all users.

**Rationale:**
- Priority is user acquisition, data validation, and product-market fit
- Universities and HR will not pay for an unproven platform
- Free access enables rapid feedback loops
- Focus on onboarding 2–3 pilot universities and 5–10 HR accounts

### Stage 2: Pilot University (6–18 Months)

**Model:** Freemium students + tiered HR subscription.

**Rationale:**
- Students remain free (core ERS, roadmap, basic matching)
- Premium student tier (SAR 29–49/month): priority matching, advanced roadmap, certification tracking
- HR subscription begins: access to verified profiles, ERS filters, applicant management
- University partnerships formalized with data-sharing agreements

### Stage 3: National Scale (18–36 Months)

**Model:** Hybrid (subscription + success fees) + institutional licensing.

**Rationale:**
- Enterprise HR: annual subscription + per-hire success fee (5–8% of first-month salary)
- University licensing: annual platform fee per institution
- Government contracts: Saudization compliance reporting tools
- Student premium conversion target: 8–12%

---

## 3. Saudi-Market Pricing Ranges (SAR)

### HR / Company Pricing

| Tier | Monthly (SAR) | Annual (SAR) | Features |
|---|---|---|---|
| SME (1–50 employees) | 500–1,200 | 5,000–12,000 | 5 job posts/month, ERS filters, basic analytics |
| Mid-Market (51–500) | 1,500–3,500 | 15,000–36,000 | Unlimited posts, talent pools, AI ranking |
| Enterprise (500+) | 5,000–12,000 | 50,000–120,000 | API access, bulk hiring, dedicated support, custom reporting |

### University Pricing

| Tier | Annual (SAR) | Features |
|---|---|---|
| Pilot (free) | 0 | Basic integration, limited analytics |
| Standard | 25,000–60,000 | Full transcript integration, engagement dashboards |
| Premium | 80,000–150,000 | Custom branding, API, employability reporting |

### Student Premium (Optional)

| Feature | Monthly (SAR) |
|---|---|
| Free tier | 0 — ERS, basic roadmap, opportunity browsing |
| Premium | 29–49 — Priority matching, advanced analytics, certification recommendations |

---

## 4. Risk Analysis

### Legal Risk

- **Transcript data:** Requires formal data-sharing agreements with universities under Saudi PDPL (Personal Data Protection Law)
- **Conduct records:** Highly sensitive — must be handled with explicit student consent and strict access controls
- **Mitigation:** Legal counsel specializing in Saudi data protection; template DSAs for university partners

### PDPL Compliance

- Data minimization: collect only what is necessary for ERS calculation
- Purpose limitation: data used only for employment readiness assessment
- Consent management: explicit opt-in for conduct/attendance data sharing
- Right to access: students can view all data held about them
- Right to deletion: students can request data removal (with impact on ERS)

### Reputational Risk

- **Scoring fairness:** Any perception of bias undermines platform credibility
- **Mitigation:** Transparent scoring methodology, published certification weights, independent audit capability
- **Misconduct data:** If leaked or misused, severe brand damage
- **Mitigation:** End-to-end encryption, role-based access, audit logging

### Governance Risk

- **Score manipulation:** Universities or students attempting to inflate metrics
- **Mitigation:** Central Admin controls all scoring weights; universities can only submit data, not adjust scores
- **Single point of failure:** Central Admin compromise
- **Mitigation:** Multi-factor authentication, separation of duties, change logs

---

## 5. Sensitive Data Strategy

### Data Classification

| Data Type | Sensitivity | Access Level |
|---|---|---|
| Academic transcript | High | Student (own), HR (with consent), Admin |
| Conduct records | Critical | Student (own), HR (summary only), Admin |
| Attendance records | High | Student (own), Admin, University (upload only) |
| ERS scores | Medium | Student, HR, Admin |
| Certification records | Medium | Student, HR, Admin |

### Access Control Logic

```
IF user.role === 'student' → access own data only
IF user.role === 'hr' → access consented student profiles (read-only)
IF user.role === 'university' → upload records only (no read of other university data)
IF user.role === 'admin' → full platform governance access
```

### Data Minimization

- HR sees ERS breakdown and summary flags, not raw conduct details
- Conduct records show category and impact score, not incident narratives
- Attendance shown as percentage threshold compliance, not daily logs

### Audit Logging

- All data access events logged with timestamp, user ID, resource accessed
- Logs immutable and retained for 24 months
- Quarterly audit reviews by platform governance team

### Student Consent Framework

1. **Onboarding consent:** Students agree to terms including data usage scope
2. **Granular consent:** Students can opt-out of conduct/attendance sharing (with ERS impact disclosure)
3. **Withdrawal:** Students can withdraw consent; data anonymized within 30 days
4. **Transparency:** Students can view all data shared with HR at any time

---

## 6. Governance Model

### Central Admin (Platform Governance)

- Owns and controls all scoring formulas and weights
- Approves/rejects certification point values
- Manages leaderboard normalization algorithms
- Controls platform-wide settings and policies
- Audits university data submissions
- Handles dispute resolution

### University Admin (Data Contributor)

- Uploads attendance records
- Uploads conduct/disciplinary records
- Records positive contributions (events, mentoring, competitions)
- Records negative violations
- **Cannot** modify ERS scores or certification weights
- **Cannot** access other universities' data

### HR (Consumer)

- Posts and manages opportunities
- Views verified student profiles (with consent)
- Filters and ranks applicants
- **Cannot** modify any academic or conduct data
- **Cannot** access platform governance settings

### Scoring Control Ownership

- All ERS formula weights maintained exclusively by Central Admin
- Certification point values are fixed and version-controlled
- Any weight changes require documented justification and audit trail
- Universities and HR have zero ability to influence scoring

---

## 7. 12-Month Saudi Go-To-Market Roadmap

### Q1 (Months 1–3): Foundation

**Objective:** Validate product-market fit with pilot users.

- Close 2–3 pilot university partnerships (target: KSU, KFUPM, KAU)
- Onboard 200–500 student beta users
- Register 10–15 HR accounts (Saudi Aramco, STC, SABIC outreach)
- Submit to Saudi accelerator programs (Flat6Labs Jeddah, SVC, Misk Innovation)
- **KPIs:** 500 registered students, 10 HR accounts, 2 LOIs from universities

### Q2 (Months 4–6): Traction

**Objective:** Demonstrate engagement and early matching value.

- Launch first CO-OP matching cycle
- Publish ERS methodology whitepaper for university stakeholders
- Begin university data integration (attendance, conduct)
- First HR opportunity postings go live
- **KPIs:** 2,000 students, 30 HR accounts, 50 opportunities posted, 200 applications

### Q3 (Months 7–9): Monetization Pilot

**Objective:** Test willingness to pay.

- Launch HR subscription beta (discounted founder pricing)
- Introduce student premium tier
- Formalize 2+ university data-sharing agreements
- Present at Saudi HR conferences (SHRM Saudi, Glowork events)
- **KPIs:** SAR 15,000–30,000 MRR, 5,000 students, 3 paying HR clients

### Q4 (Months 10–12): Scale Preparation

**Objective:** Prove unit economics for seed round.

- Reach 10,000+ student profiles
- 50+ HR clients (mix of free and paid)
- 5+ university partnerships
- Seed round preparation: deck, financials, pipeline metrics
- **KPIs:** SAR 50,000+ MRR, 10,000 students, seed round term sheet

### Partnership Approach

1. **Universities first:** They provide the supply (students + data). Approach via Career Services departments.
2. **HR second:** Once student profiles are populated with verified data, HR value proposition becomes tangible.
3. **Government third:** Once traction is demonstrated, position for HRDF/Tamheer integration.

### Early Traction Metrics to Track

- Student registration rate (weekly)
- ERS completion rate (% of students with full profiles)
- HR search-to-shortlist conversion
- Application-to-interview rate
- University data upload frequency
- Student DAU/WAU ratio

---

## 8. Final Executive Summary

### Best Early Monetization Approach

Free platform access for all users during the first 6 months. Introduce freemium student tiers and HR subscriptions at the pilot stage. This minimizes adoption friction while building the verified data asset that makes HireQimah valuable.

### Best Long-Term Scalable Model

Hybrid subscription + success-fee model for HR, combined with institutional licensing for universities and optional student premium. This creates three independent revenue streams with strong recurring characteristics.

### Investor Positioning

HireQimah is not a job board. It is **employment readiness infrastructure** for Saudi Arabia. The platform creates a new category: verified, standardized, and transparent graduate assessment that aligns with Vision 2030's Saudization mandates.

**Defensibility:**
- Network effects (more students → more HR → more universities → more students)
- Data moat (verified transcripts, conduct records, certification history)
- Institutional relationships (university partnerships are high-barrier, high-retention)
- Regulatory alignment (Saudization compliance is mandatory, not optional)

### HR Value Proposition

Reduce time-to-hire for Saudi graduates by 60%. Eliminate CV fraud. Access pre-ranked, verified candidates with transparent readiness metrics. Support Saudization compliance with auditable hiring data.

### Why HireQimah Can Become National Infrastructure

Saudi Arabia has 30+ public universities, 12+ private universities, and 400,000+ enrolled students. Every university needs employability metrics. Every employer needs Saudization compliance. Every student needs market clarity. HireQimah is the single platform that serves all three — with verified data, standardized scoring, and transparent governance.

The question is not whether Saudi Arabia needs this infrastructure. It is who builds it first.

---

*Document prepared for strategic planning purposes. All projections are estimates based on Saudi market analysis and comparable platform benchmarks. Actual results will depend on execution, market conditions, and partnership outcomes.*

*© 2026 HireQimah. Confidential.*
