import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } from "docx";

export interface ProtocolData {
    // Standard Headers
    title: string;
    setting: string;
    pi: string;
    coInvestigators: string;
    mentor: string;
    sponsor: string;
    committee: string;
    irbStatus: string; // "QI Exempt" | "IRB Review Needed" | "Approved"
    irbNumber: string;

    // Section 1: Project Overview Response Matrix
    problem: string;
    aim: string;
    intervention: string;
    outcomeMeasure: string;
    processMeasure: string;
    balancingMeasure: string;
    targetPop: string;
    duration: string;

    // Section 2: Background & Evidence-Based Rationale
    background: string;
    baselineData: string;
    evidence: string;
    evidenceGaps: string;
    citations: string;

    // Section 3: Study Outcomes Table
    outcomesTable: { type: string; def: string; source: string; target: string }[];

    // Section 4: Methods
    design: "PDSA" | "Lean" | "Six Sigma" | "Other";
    designOtherText: string;
    designDesc: string;
    
    // 4.2 Setting and Population
    settingDetails: string;
    popDetails: string;
    inclusionCriteria: string;
    exclusionCriteria: string;
    baselineTimeframe: string;
    postTimeframe: string;

    // 4.3 Interventions
    chartReviewDesc: string;
    educationDesc: string;
    emrToolsDesc: string;
    responsibilitiesDesc: string;

    // 4.4 PDSA Cycles
    pdsaCycles: { cycle: string; plan: string; do: string; study: string; act: string }[];

    // Section 5: Measures & Data Collection
    measuresTable: { measure: string; type: string; def: string; denNum: string; freq: string; source: string }[];
    epicReviewSource: boolean;
    registrySource: boolean;
    surveySource: boolean;
    otherSource: boolean;
    otherSourceText: string;
    dataAbstractionPlan: string;

    // Section 6: Data Management & HIPAA
    spreadsheetFile: boolean;
    pdfFile: boolean;
    redcapFile: boolean;
    otherFile: boolean;
    otherFileText: string;
    dataManagementDetails: string;

    // Section 7: Timeline & Team Roles
    timelineChart: { phase: string; dates: string; owner: string; deliverable: string }[];
    meetingMonthly: boolean;
    meetingBiweekly: boolean;
    meetingOther: boolean;
    meetingOtherText: string;

    // 7.1 Task Assignments per Investigator
    tasksTable: { investigator: string; role: string; tasks: string; dates: string }[];

    // Section 8: Analysis Plan
    excelAnalysis: boolean;
    epicAnalysis: boolean;
    pythonAnalysis: boolean;
    otherAnalysis: boolean;
    otherAnalysisText: string;
    analysisPlan: string;

    // Section 9: Results Reporting Plan
    resultsPlan: string;

    // Section 10: Discussion & Sustainability
    discussionText: string;
    sustainability: string; // 10.1 Plan

    // Section 11: Ethical Considerations
    ethical: string;

    // Section 12: Funding & Resources
    fundingNone: boolean;
    fundingDept: boolean;
    fundingGrant: boolean;
    fundingOther: boolean;
    fundingOtherText: string;
    stipendsNone: boolean;
    stipendsYes: boolean;
    stipendsText: string;
    materialsNeeded: string;

    // Section 13: Dissemination Plan
    dissemination: string;

    // Section 14: References
    references: string;
}

export async function generateProtocolDoc(data: ProtocolData): Promise<Blob> {
    // Helper to format checkboxes
    const cb = (val: boolean) => (val ? "☒" : "☐");

    // Double border styling for tables
    const tableBorders = {
        top: { style: BorderStyle.SINGLE, size: 8, color: "CCCCCC" },
        bottom: { style: BorderStyle.SINGLE, size: 8, color: "CCCCCC" },
        left: { style: BorderStyle.SINGLE, size: 8, color: "CCCCCC" },
        right: { style: BorderStyle.SINGLE, size: 8, color: "CCCCCC" },
    };

    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    margin: {
                        top: 1440, // 1 inch
                        bottom: 1440,
                        left: 1440,
                        right: 1440,
                    }
                }
            },
            children: [
                // Title and Subtitle Block
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: "QUALITY IMPROVEMENT (QI) PROJECT PROTOCOL TEMPLATE",
                            bold: true,
                            size: 28, // 14pt
                            color: "003057", // AdventHealth Cobalt
                        }),
                    ],
                    spacing: { after: 120 },
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: "AdventHealth Internal Medicine Graduate Medical Education — Tampa, Florida",
                            italic: true,
                            size: 20, // 10pt
                            color: "555555",
                        }),
                    ],
                    spacing: { after: 400 },
                }),

                // Official GME Headers (Double border table look or highly organized checklist)
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: tableBorders,
                    rows: [
                        createHeaderRow("Study / Project Title", data.title),
                        createHeaderRow("Clinical Site / Setting", data.setting),
                        createHeaderRow("Study Sponsor / Program", data.sponsor || "AdventHealth IM GME — Tampa, FL"),
                        createHeaderRow("Principal Investigator (Resident)", data.pi),
                        createHeaderRow("Co-Investigators (Residents/Students)", data.coInvestigators),
                        createHeaderRow("Faculty Mentor(s)", data.mentor),
                        createHeaderRow("QI Committee / Sponsor (if applicable)", data.committee || "N/A"),
                        createHeaderRow("IRB / QI Determination", 
                            `IRB #: ${data.irbNumber || "________"}   |   QI Determination: ` +
                            `${cb(data.irbStatus === "QI Exempt")} QI/Not Human Subjects Research   ` +
                            `${cb(data.irbStatus === "IRB Review Needed")} IRB Review Needed`
                        ),
                    ],
                }),

                new Paragraph({
                    text: "Use this as a working protocol for your QI project. Keep it concise but specific. Replace all placeholders and delete guidance text before submission/presentation.",
                    italic: true,
                    size: 18,
                    color: "666666",
                    spacing: { before: 200, after: 300 },
                }),

                // Section 1: Project Overview Matrix
                createSectionHeading("1. Project Overview"),
                new Paragraph({
                    text: "Briefly summarize the problem, the aim, and what you will change.",
                    italic: true,
                    size: 19,
                    spacing: { after: 150 },
                }),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: tableBorders,
                    rows: [
                        createGridRow("Item", "Response (fill in)", true),
                        createGridRow("Problem (1-2 sentences)", data.problem),
                        createGridRow("Aim Statement (SMART)", data.aim),
                        createGridRow("Proposed Intervention(s)", data.intervention),
                        createGridRow("Primary Outcome Measure", data.outcomeMeasure),
                        createGridRow("Process Measure(s)", data.processMeasure),
                        createGridRow("Balancing Measure(s)", data.balancingMeasure),
                        createGridRow("Target Population", data.targetPop),
                        createGridRow("Projected Project Duration", data.duration || "3–6 months (typical)"),
                    ],
                }),

                // Section 2: Background and Rationale
                createSectionHeading("2. Background and Evidence-Based Rationale"),
                createGuidanceParagraph("Describe why this matters and what is known. Include brief local context."),
                createSubSectionHeading("Clinical Problem and Impact"),
                new Paragraph({ text: data.background || "No background narrative provided.", spacing: { after: 150 } }),
                createSubSectionHeading("Current Status / Baseline Data"),
                new Paragraph({ text: data.baselineData || "No baseline data description provided.", spacing: { after: 150 } }),
                createSubSectionHeading("Evidence Supporting Proposed Change"),
                new Paragraph({ text: data.evidence || "No evidence description provided.", spacing: { after: 150 } }),
                createSubSectionHeading("Evidence Gaps or Local Barriers"),
                new Paragraph({ text: data.evidenceGaps || "No local barriers/gaps described.", spacing: { after: 150 } }),
                createSubSectionHeading("Citations"),
                new Paragraph({ text: data.citations || "None listed in this section.", italic: true, spacing: { after: 200 } }),

                // Section 3: Study Outcomes Table
                createSectionHeading("3. Study Outcomes and Aim Statement"),
                createGuidanceParagraph("Use SMART: Specific, Measurable, Achievable, Relevant, Time-bound."),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: tableBorders,
                    rows: [
                        createOutcomesHeader(),
                        ...data.outcomesTable.map(o => createOutcomesRow(o.type, o.def, o.source, o.target))
                    ],
                }),

                // Section 4: Methods
                createSectionHeading("4. Methods"),
                createSubSectionHeading("4.1 QI Design"),
                createGuidanceParagraph("Specify your QI framework and why it fits (e.g., Plan-Do-Study-Act)."),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Design: ", bold: true }),
                        new TextRun({ text: `${cb(data.design === "PDSA")} PDSA    ` }),
                        new TextRun({ text: `${cb(data.design === "Lean")} Lean    ` }),
                        new TextRun({ text: `${cb(data.design === "Six Sigma")} Six Sigma    ` }),
                        new TextRun({ text: `${cb(data.design === "Other")} Other: ${data.designOtherText || "__________"}` }),
                    ],
                    spacing: { after: 100 },
                }),
                new Paragraph({ text: data.designDesc || "No design description provided.", spacing: { after: 200 } }),

                createSubSectionHeading("4.2 Setting and Population"),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: tableBorders,
                    rows: [
                        createGridRow("Component", "Details", true),
                        createGridRow("Setting (clinic/unit/service)", data.settingDetails),
                        createGridRow("Population / stakeholders affected", data.popDetails),
                        createGridRow("Inclusion criteria", data.inclusionCriteria),
                        createGridRow("Exclusion criteria", data.exclusionCriteria),
                        createGridRow("Timeframe for baseline (pre-intervention) data", data.baselineTimeframe),
                        createGridRow("Timeframe for post-intervention data", data.postTimeframe),
                    ],
                }),

                new Paragraph({ text: "", spacing: { after: 200 } }),

                createSubSectionHeading("4.3 Interventions"),
                createGuidanceParagraph("Describe each intervention step with enough detail for replication."),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Retrospective Chart / Source Review: ", bold: true }),
                        new TextRun(data.chartReviewDesc || "None specified."),
                    ],
                    spacing: { after: 100 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Education and Outreach: ", bold: true }),
                        new TextRun(data.educationDesc || "None specified."),
                    ],
                    spacing: { after: 100 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Workflow and Epic EMR Tools: ", bold: true }),
                        new TextRun(data.emrToolsDesc || "None specified."),
                    ],
                    spacing: { after: 100 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Responsibilities (who does what, when): ", bold: true }),
                        new TextRun(data.responsibilitiesDesc || "None specified."),
                    ],
                    spacing: { after: 200 },
                }),

                createSubSectionHeading("4.4 PDSA Cycles"),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: tableBorders,
                    rows: [
                        createPDSAHeader(),
                        ...(data.pdsaCycles && data.pdsaCycles.length > 0 
                            ? data.pdsaCycles.map(c => createPDSARow(c.cycle, c.plan, c.do, c.study, c.act))
                            : [createPDSARow("PDSA 1", "Placeholder Plan", "Placeholder Do", "Placeholder Study", "Placeholder Act")])
                    ],
                }),

                // Section 5: Measures
                createSectionHeading("5. Measures and Data Collection"),
                createGuidanceParagraph("List outcome, process, and balancing measures with operational definitions."),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: tableBorders,
                    rows: [
                        createMeasuresHeader(),
                        ...(data.measuresTable && data.measuresTable.length > 0
                            ? data.measuresTable.map(m => createMeasuresRow(m.measure, m.type, m.def, m.denNum, m.freq, m.source))
                            : [createMeasuresRow("Placeholder Measure", "Outcome", "Definition", "Denominator/Numerator", "Weekly", "Epic chart review")])
                    ],
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Data Source(s): ", bold: true }),
                        new TextRun({ text: `${cb(data.epicReviewSource)} Epic chart review    ` }),
                        new TextRun({ text: `${cb(data.registrySource)} Registry    ` }),
                        new TextRun({ text: `${cb(data.surveySource)} Survey    ` }),
                        new TextRun({ text: `${cb(data.otherSource)} Other: ${data.otherSourceText || "_________"}` }),
                    ],
                    spacing: { before: 150, after: 100 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Data Abstraction Plan: ", bold: true }),
                        new TextRun(data.dataAbstractionPlan || "None specified."),
                    ],
                    spacing: { after: 200 },
                }),

                // Section 6: Data Management & Security
                createSectionHeading("6. Data Management, HIPAA, and Security"),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Standard Institutional Policies Applied:\n", bold: true, color: "003057" }),
                        new TextRun({ text: "• Store data in a HIPAA-compliant location (e.g. AdventHealth OneDrive/SharePoint).\n", size: 18 }),
                        new TextRun({ text: "• Limit access to QI investigators and mentor(s) only.\n", size: 18 }),
                        new TextRun({ text: "• Preferred identifiers: MRN only (avoid names/addresses).\n", size: 18 }),
                        new TextRun({ text: "• Restrict separate re-identification key access if needed.\n", size: 18 }),
                        new TextRun({ text: "• Data quality assurance: monthly spot-checks on 10% of entries to verify accuracy.\n", size: 18 }),
                        new TextRun({ text: "• Data retention: retain records for 7 years per institutional policy.", size: 18 }),
                    ],
                    spacing: { after: 150 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "File Types Utilized: ", bold: true }),
                        new TextRun({ text: `${cb(data.spreadsheetFile)} Spreadsheet    ` }),
                        new TextRun({ text: `${cb(data.pdfFile)} PDF    ` }),
                        new TextRun({ text: `${cb(data.redcapFile)} REDCap    ` }),
                        new TextRun({ text: `${cb(data.otherFile)} Other: ${data.otherFileText || "_________"}` }),
                    ],
                    spacing: { after: 100 },
                }),
                new Paragraph({ text: data.dataManagementDetails || "No additional data security details provided.", spacing: { after: 200 } }),

                // Section 7: Timeline & Team Roles
                createSectionHeading("7. Timeline and Team Roles"),
                createGuidanceParagraph("Typical total duration is 3–6 months; adjust as needed."),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: tableBorders,
                    rows: [
                        createTimelineHeader(),
                        ...(data.timelineChart && data.timelineChart.length > 0
                            ? data.timelineChart.map(t => createTimelineRow(t.phase, t.dates, t.owner, t.deliverable))
                            : [
                                createTimelineRow("Retrospective chart review (Month 1)", "", "", ""),
                                createTimelineRow("Patient outreach & education (Month 2–3)", "", "", ""),
                                createTimelineRow("Intervention implementation (Month 3–5)", "", "", ""),
                                createTimelineRow("Post-intervention data collection/analysis (Month 6)", "", "", ""),
                                createTimelineRow("Presentation/poster preparation", "", "", "")
                            ])
                    ],
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Team Meetings Frequency: ", bold: true }),
                        new TextRun({ text: `${cb(data.meetingMonthly)} Monthly    ` }),
                        new TextRun({ text: `${cb(data.meetingBiweekly)} Every 2 weeks    ` }),
                        new TextRun({ text: `${cb(data.meetingOther)} Other: ${data.meetingOtherText || "__________"}` }),
                    ],
                    spacing: { before: 150, after: 200 },
                }),

                createSubSectionHeading("7.1 Task Assignments per Investigator"),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: tableBorders,
                    rows: [
                        createTasksHeader(),
                        ...(data.tasksTable && data.tasksTable.length > 0
                            ? data.tasksTable.map(t => createTasksRow(t.investigator, t.role, t.tasks, t.dates))
                            : [createTasksRow("PI Name", "Principal Investigator", "Project oversight, data collection", "")])
                    ],
                }),

                new Paragraph({ text: "", spacing: { after: 200 } }),

                // Section 8: Analysis Plan
                createSectionHeading("8. Analysis Plan"),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Software/Tools Utilized: ", bold: true }),
                        new TextRun({ text: `${cb(data.excelAnalysis)} Excel    ` }),
                        new TextRun({ text: `${cb(data.epicAnalysis)} Epic reporting    ` }),
                        new TextRun({ text: `${cb(data.pythonAnalysis)} R/Python    ` }),
                        new TextRun({ text: `${cb(data.otherAnalysis)} Other: ${data.otherAnalysisText || "_________"}` }),
                    ],
                    spacing: { after: 100 },
                }),
                new Paragraph({ text: data.analysisPlan || "No specific statistical/analysis details provided.", spacing: { after: 200 } }),

                // Section 9: Results Reporting Plan
                createSectionHeading("9. Results Reporting Plan"),
                new Paragraph({ text: data.resultsPlan || "Data documentation will remain HIPAA-compliant with restricted access to only QI investigators and mentor(s). Findings will be summarized in narrative, tables, and charts.", spacing: { after: 200 } }),

                // Section 10: Discussion & Sustainability
                createSectionHeading("10. Discussion and Sustainability"),
                new Paragraph({ text: data.discussionText || "No discussion template specified.", spacing: { after: 150 } }),
                createSubSectionHeading("10.1 Sustainability Plan"),
                new Paragraph({ text: data.sustainability || "Describe how the intervention will be maintained (handoffs, ownership, EMR tools, education, audit-and-feedback).", spacing: { after: 200 } }),

                // Section 11: Ethical Considerations
                createSectionHeading("11. Ethical Considerations and Approvals"),
                new Paragraph({ text: data.ethical || "Minimal clinical risk expected. Patient privacy fully protected under standard AdventHealth clinical surveillance guidelines.", spacing: { after: 200 } }),

                // Section 12: Funding
                createSectionHeading("12. Funding and Resources"),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: tableBorders,
                    rows: [
                        createGridRow("Item", "Details", true),
                        createGridRow("Funding Source", 
                            `${cb(data.fundingNone)} None   ` +
                            `${cb(data.fundingDept)} Departmental   ` +
                            `${cb(data.fundingGrant)} Grant   ` +
                            `${cb(data.fundingOther)} Other: ${data.fundingOtherText || "__________"}`
                        ),
                        createGridRow("Subject Stipends", 
                            `${cb(data.stipendsNone)} None   ` +
                            `${cb(data.stipendsYes)} Yes: ${data.stipendsText || "________________"}`
                        ),
                        createGridRow("Materials/Tools Needed", data.materialsNeeded || "None specified."),
                    ],
                }),

                new Paragraph({ text: "", spacing: { after: 200 } }),

                // Section 13: Dissemination Plan
                createSectionHeading("13. Dissemination Plan"),
                new Paragraph({ text: data.dissemination || "QI summary slides and poster to be presented (5-minute Quality Initiative Conference presentation). Review with mentor before presentation.", spacing: { after: 200 } }),

                // Section 14: References
                createSectionHeading("14. References"),
                createGuidanceParagraph("Minimum of 3 references. Use national recognized journals/organizations."),
                new Paragraph({ text: data.references || "1. No references listed.", spacing: { after: 200 } }),
            ],
        }],
    });

    const blob = await Packer.toBlob(doc);
    return blob;
}

// Helper formatting functions
function createSectionHeading(text: string) {
    return new Paragraph({
        children: [
            new TextRun({
                text: text,
                bold: true,
                size: 24, // 12pt
                color: "003057",
            }),
        ],
        spacing: { before: 300, after: 100 },
        keepWithNext: true,
    });
}

function createSubSectionHeading(text: string) {
    return new Paragraph({
        children: [
            new TextRun({
                text: text,
                bold: true,
                size: 20, // 10pt
                color: "004F9F", // Navy Accent
            }),
        ],
        spacing: { before: 150, after: 60 },
        keepWithNext: true,
    });
}

function createGuidanceParagraph(text: string) {
    return new Paragraph({
        children: [
            new TextRun({
                text: text,
                italic: true,
                size: 18,
                color: "777777",
            })
        ],
        spacing: { after: 100 },
    });
}

function createHeaderRow(label: string, value: string) {
    return new TableRow({
        children: [
            new TableCell({
                width: { size: 30, type: WidthType.PERCENTAGE },
                shading: { fill: "F2F2F2" },
                children: [
                    new Paragraph({
                        children: [new TextRun({ text: label, bold: true, size: 19 })],
                    }),
                ],
            }),
            new TableCell({
                width: { size: 70, type: WidthType.PERCENTAGE },
                children: [
                    new Paragraph({
                        children: [new TextRun({ text: value || "", size: 19 })],
                    }),
                ],
            }),
        ],
    });
}

function createGridRow(col1: string, col2: string, isHeader = false) {
    return new TableRow({
        children: [
            new TableCell({
                width: { size: 35, type: WidthType.PERCENTAGE },
                shading: isHeader ? { fill: "003057" } : undefined,
                children: [
                    new Paragraph({
                        children: [new TextRun({ 
                            text: col1, 
                            bold: true, 
                            size: 19,
                            color: isHeader ? "FFFFFF" : undefined
                        })],
                    }),
                ],
            }),
            new TableCell({
                width: { size: 65, type: WidthType.PERCENTAGE },
                shading: isHeader ? { fill: "003057" } : undefined,
                children: [
                    new Paragraph({
                        children: [new TextRun({ 
                            text: col2 || "", 
                            bold: isHeader, 
                            size: 19,
                            color: isHeader ? "FFFFFF" : undefined
                        })],
                    }),
                ],
            }),
        ],
    });
}

// Outcomes Row builders
function createOutcomesHeader() {
    return new TableRow({
        children: ["Outcome Type", "Definition / Operationalization", "Data Source", "Target"].map(h => 
            new TableCell({
                shading: { fill: "003057" },
                children: [new Paragraph({
                    children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 19 })]
                })]
            })
        )
    });
}

function createOutcomesRow(type: string, def: string, source: string, target: string) {
    return new TableRow({
        children: [type, def, source, target].map(text => 
            new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: text || "", size: 18 })] })]
            })
        )
    });
}

// PDSA Row builders
function createPDSAHeader() {
    return new TableRow({
        children: ["Cycle", "Plan (what change)", "Do (who/where)", "Study (what data)", "Act (next step)"].map(h => 
            new TableCell({
                shading: { fill: "003057" },
                children: [new Paragraph({
                    children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 19 })]
                })]
            })
        )
    });
}

function createPDSARow(cycle: string, plan: string, d: string, study: string, act: string) {
    return new TableRow({
        children: [cycle, plan, d, study, act].map(text => 
            new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: text || "", size: 18 })] })]
            })
        )
    });
}

// Measures Row builders
function createMeasuresHeader() {
    return new TableRow({
        children: ["Measure Name", "Type", "Operational Definition", "Denominator / Numerator", "Frequency", "Source"].map(h => 
            new TableCell({
                shading: { fill: "003057" },
                children: [new Paragraph({
                    children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 19 })]
                })]
            })
        )
    });
}

function createMeasuresRow(measure: string, type: string, def: string, denNum: string, freq: string, source: string) {
    return new TableRow({
        children: [measure, type, def, denNum, freq, source].map(text => 
            new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: text || "", size: 18 })] })]
            })
        )
    });
}

// Timeline Row builders
function createTimelineHeader() {
    return new TableRow({
        children: ["Phase", "Planned Dates", "Owner(s)", "Deliverable"].map(h => 
            new TableCell({
                shading: { fill: "003057" },
                children: [new Paragraph({
                    children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 19 })]
                })]
            })
        )
    });
}

function createTimelineRow(phase: string, dates: string, owner: string, deliverable: string) {
    return new TableRow({
        children: [phase, dates, owner, deliverable].map(text => 
            new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: text || "", size: 18 })] })]
            })
        )
    });
}

// Tasks Row builders
function createTasksHeader() {
    return new TableRow({
        children: ["Investigator", "Role", "Tasks", "Start/End Dates"].map(h => 
            new TableCell({
                shading: { fill: "003057" },
                children: [new Paragraph({
                    children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 19 })]
                })]
            })
        )
    });
}

function createTasksRow(investigator: string, role: string, tasks: string, dates: string) {
    return new TableRow({
        children: [investigator, role, tasks, dates].map(text => 
            new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: text || "", size: 18 })] })]
            })
        )
    });
}
