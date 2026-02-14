import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } from "docx";
import { saveAs } from "file-saver";

export interface ProtocolData {
    title: string;
    setting: string;
    pi: string;
    coInvestigators: string;
    mentor: string;
    irbStatus: string;

    // Section 1: Overview
    problem: string;
    aim: string;
    intervention: string;
    outcomeMeasure: string;
    processMeasure: string;
    balancingMeasure: string;
    targetPop: string;
    duration: string;

    // Section 2: Background
    background: string;
    baselineData: string;
    evidence: string;
    citations: string;

    // Section 3: Outcomes
    outcomesTable: { type: string, def: string, source: string, target: string }[];

    // Section 4: Methods
    design: string;
    designDesc: string;
    populationDetails: { component: string, details: string }[];
    interventionsDesc: string;
    pdsaCycles: { cycle: string, plan: string, do: string, study: string, act: string }[];

    // Section 5: Measures
    measuresTable: { measure: string, type: string, def: string, denNum: string, freq: string, source: string }[];

    // Section 6-13: Narratives
    hipaa: string;
    analysisPlan: string;
    sustainability: string;
    ethical: string;
    dissemination: string;
    references: string;
}

export async function generateProtocolDoc(data: ProtocolData) {
    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    text: "QUALITY IMPROVEMENT (QI) PROJECT PROTOCOL",
                    heading: HeadingLevel.HEADING_1,
                    alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                    text: "AdventHealth Internal Medicine Graduate Medical Education — Tampa, Florida",
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 },
                }),

                // Headers
                ...createHeaderField("Study / Project Title", data.title),
                ...createHeaderField("Clinical Site / Setting", data.setting),
                ...createHeaderField("Principal Investigator (Resident)", data.pi),
                ...createHeaderField("Co-Investigators", data.coInvestigators),
                ...createHeaderField("Faculty Mentor(s)", data.mentor),
                ...createHeaderField("IRB / QI Determination", data.irbStatus),

                new Paragraph({ text: "", spacing: { before: 400 } }),

                // Section 1
                new Paragraph({ text: "1. Project Overview", heading: HeadingLevel.HEADING_2 }),
                createTable([
                    ["Item", "Response"],
                    ["Problem", data.problem],
                    ["Aim Statement (SMART)", data.aim],
                    ["Proposed Interventions", data.intervention],
                    ["Primary Outcome", data.outcomeMeasure],
                    ["Process Measures", data.processMeasure],
                    ["Balancing Measures", data.balancingMeasure],
                    ["Target Population", data.targetPop],
                    ["Duration", data.duration],
                ]),

                // Section 2
                new Paragraph({ text: "2. Background and Evidence", heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: data.background }),
                new Paragraph({ text: "Baseline Data:", heading: HeadingLevel.HEADING_4 }),
                new Paragraph({ text: data.baselineData }),
                new Paragraph({ text: "Evidence-Based Rationale:", heading: HeadingLevel.HEADING_4 }),
                new Paragraph({ text: data.evidence }),

                // Section 3
                new Paragraph({ text: "3. Study Outcomes", heading: HeadingLevel.HEADING_2 }),
                createTable([
                    ["Type", "Definition", "Data Source", "Target"],
                    ...data.outcomesTable.map(o => [o.type, o.def, o.source, o.target])
                ]),

                // Section 4
                new Paragraph({ text: "4. Methods", heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: `Design: ${data.design}`, heading: HeadingLevel.HEADING_3 }),
                new Paragraph({ text: data.designDesc }),

                new Paragraph({ text: "Setting and Population:", heading: HeadingLevel.HEADING_3 }),
                createTable([
                    ["Component", "Details"],
                    ...data.populationDetails.map(p => [p.component, p.details])
                ]),

                new Paragraph({ text: "Interventions:", heading: HeadingLevel.HEADING_3 }),
                new Paragraph({ text: data.interventionsDesc }),

                new Paragraph({ text: "PDSA Cycles:", heading: HeadingLevel.HEADING_3 }),
                createTable([
                    ["Cycle", "Plan", "Do", "Study", "Act"],
                    ...data.pdsaCycles.map(c => [c.cycle, c.plan, c.do, c.study, c.act])
                ]),

                // Section 5
                new Paragraph({ text: "5. Measures", heading: HeadingLevel.HEADING_2 }),
                createTable([
                    ["Measure", "Type", "Definition", "Den/Num", "Frequency", "Source"],
                    ...data.measuresTable.map(m => [m.measure, m.type, m.def, m.denNum, m.freq, m.source])
                ]),

                // Narrative Sections
                ...createNarrativeSection("6. Data Management & HIPAA", data.hipaa),
                ...createNarrativeSection("8. Analysis Plan", data.analysisPlan),
                ...createNarrativeSection("10. Sustainability", data.sustainability),
                ...createNarrativeSection("11. Ethical Considerations", data.ethical),
                ...createNarrativeSection("13. Dissemination", data.dissemination),
                ...createNarrativeSection("14. References", data.references),
            ],
        }],
    });

    const blob = await Packer.toBlob(doc);
    return blob;
}

function createHeaderField(label: string, value: string) {
    return [
        new Paragraph({
            children: [
                new TextRun({ text: `${label}: `, bold: true }),
                new TextRun(value),
            ],
        })
    ];
}

function createNarrativeSection(title: string, content: string) {
    return [
        new Paragraph({ text: title, heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: content, spacing: { after: 200 } }),
    ];
}

function createTable(rows: string[][]) {
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: rows.map((row, i) => new TableRow({
            children: row.map(cell => new TableCell({
                children: [new Paragraph({
                    text: cell,
                    style: i === 0 ? "bold" : undefined
                })],
                shading: i === 0 ? { fill: "F2F2F2" } : undefined,
            })),
        })),
    });
}
