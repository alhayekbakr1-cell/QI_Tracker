import { saveAs } from 'file-saver'
import { 
    Document, 
    Packer, 
    Paragraph, 
    TextRun, 
    HeadingLevel, 
    Table, 
    TableRow, 
    TableCell, 
    AlignmentType, 
    WidthType, 
    BorderStyle 
} from 'docx'
import { Project, Metric } from '@/types'

/**
 * Programmatically constructs and downloads a high-fidelity Microsoft Word (.docx)
 * publication draft structured strictly according to SQUIRE 2.0 guidelines.
 */
export async function exportToSquireWord(project: Project, metrics: Metric[]) {
    // 1. Define visual styles (Georgia for headers, Calibri for body text)
    const doc = new Document({
        styles: {
            default: {
                heading1: {
                    run: {
                        font: 'Georgia',
                        size: 26, // 13pt
                        bold: true,
                        color: '1E3A8A' // Advent Navy Primary Accent
                    },
                    paragraph: {
                        spacing: { before: 240, after: 120 }
                    }
                },
                heading2: {
                    run: {
                        font: 'Georgia',
                        size: 22, // 11pt
                        bold: true,
                        color: '3B82F6', // Cobalt Accent
                        italics: true
                    },
                    paragraph: {
                        spacing: { before: 180, after: 60 }
                    }
                }
            }
        },
        sections: [{
            properties: {},
            children: [
                // Academic Header Branding
                new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                        new TextRun({
                            text: 'AdventHealth Graduate Medical Education\n',
                            font: 'Arial',
                            size: 16, // 8pt
                            bold: true,
                            color: '64748B'
                        }),
                        new TextRun({
                            text: 'Clinical Quality & Patient Safety Program',
                            font: 'Arial',
                            size: 16,
                            color: '94A3B8'
                        })
                    ]
                }),

                // Spacing
                new Paragraph({ text: '', spacing: { after: 240 } }),

                // Document Title
                new Paragraph({
                    heading: HeadingLevel.TITLE,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 120 },
                    children: [
                        new TextRun({
                            text: 'SQUIRE 2.0 Academic Manuscript Scaffold\n',
                            font: 'Georgia',
                            size: 36, // 18pt
                            bold: true,
                            color: '1E3A8A'
                        })
                    ]
                }),

                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 480 },
                    children: [
                        new TextRun({
                            text: 'Draft Outline Prepared for Scientific Journal Publication Submission',
                            font: 'Georgia',
                            size: 20, // 10pt
                            italics: true,
                            color: '475569'
                        })
                    ]
                }),

                // Title Block Box (Styled Callout Table)
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    shading: { fill: 'F8FAFC' },
                                    margins: { top: 200, bottom: 200, left: 200, right: 200 },
                                    borders: {
                                        top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
                                        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
                                        left: { style: BorderStyle.SINGLE, size: 6, color: '1E3A8A' }, // Thick left border
                                        right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' }
                                    },
                                    children: [
                                        new Paragraph({
                                            children: [
                                                new TextRun({ text: 'Project Title: ', bold: true, font: 'Calibri' }),
                                                new TextRun({ text: project.title, bold: true, italics: true, font: 'Calibri', color: '0F172A' })
                                            ]
                                        }),
                                        new Paragraph({
                                            spacing: { before: 60 },
                                            children: [
                                                new TextRun({ text: 'Clinical Mentor: ', bold: true, font: 'Calibri' }),
                                                new TextRun({ text: project.faculty || 'Unassigned / Needs Review', font: 'Calibri' })
                                            ]
                                        }),
                                        new Paragraph({
                                            spacing: { before: 60 },
                                            children: [
                                                new TextRun({ text: 'Lead Proponents: ', bold: true, font: 'Calibri' }),
                                                new TextRun({ text: (project.lead_proponents || []).join(', ') || 'No Lead Proponents Registered', font: 'Calibri' })
                                            ]
                                        }),
                                        new Paragraph({
                                            spacing: { before: 60 },
                                            children: [
                                                new TextRun({ text: 'Team Proponents: ', bold: true, font: 'Calibri' }),
                                                new TextRun({ text: (project.proponents || []).join(', ') || 'None Registered', font: 'Calibri' })
                                            ]
                                        }),
                                        new Paragraph({
                                            spacing: { before: 60 },
                                            children: [
                                                new TextRun({ text: 'Active Cycle Status: ', bold: true, font: 'Calibri' }),
                                                new TextRun({ text: `PDSA Cycle ${project.pdsa_cycle} (${project.status})`, font: 'Calibri', color: '2563EB' })
                                            ]
                                        })
                                    ]
                                })
                            ]
                        })
                    ]
                }),

                new Paragraph({ text: '', spacing: { after: 240 } }),

                // --- SQUIRE SECTION 1: TITLE & ABSTRACT ---
                new Paragraph({ text: 'Section I: Title & Abstract', heading: HeadingLevel.HEADING_1 }),
                
                new Paragraph({
                    heading: HeadingLevel.HEADING_2,
                    children: [new TextRun({ text: 'Abstract Framework Summary' })]
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: project.abstract_summary || 
                                'Directions: Formulate a highly structured summary including: Background (why start), Local Problem (clinical gap), Methods (PDSA structure), Results (what changed), and Conclusions (lessons and sustainability).',
                            italics: !project.abstract_summary,
                            color: project.abstract_summary ? '0F172A' : '64748B',
                            font: 'Calibri'
                        })
                    ]
                }),

                // --- SQUIRE SECTION 2: INTRODUCTION ---
                new Paragraph({ text: 'Section II: Introduction', heading: HeadingLevel.HEADING_1 }),
                
                new Paragraph({
                    heading: HeadingLevel.HEADING_2,
                    children: [new TextRun({ text: '1. Rationale (Local Problem Statement)' })]
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: project.charter?.problemStatement || 
                                'Directions: Detail the clinical gap or operational patient safety deficiency observed at the institution. Explain why this issue matters to patient outcomes and local healthcare delivery.',
                            italics: !project.charter?.problemStatement,
                            color: project.charter?.problemStatement ? '0F172A' : '64748B',
                            font: 'Calibri'
                        })
                    ]
                }),

                new Paragraph({
                    heading: HeadingLevel.HEADING_2,
                    children: [new TextRun({ text: '2. Specific Aims (SMART Aim Statement)' })]
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: project.primary_outcome || project.charter?.aimStatement || 
                                'Directions: Define the explicit quantitative target. Must specify: Who (resident cohort), What (metric outcome changes), By How Much (percent changes), and By When (completion date).',
                            bold: !!(project.primary_outcome || project.charter?.aimStatement),
                            italics: !(project.primary_outcome || project.charter?.aimStatement),
                            color: (project.primary_outcome || project.charter?.aimStatement) ? '0F172A' : '64748B',
                            font: 'Calibri'
                        })
                    ]
                }),

                // --- SQUIRE SECTION 3: METHODS ---
                new Paragraph({ text: 'Section III: Methods', heading: HeadingLevel.HEADING_1 }),
                
                new Paragraph({
                    heading: HeadingLevel.HEADING_2,
                    children: [new TextRun({ text: '1. Context (Clinical Environment Setting)' })]
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: project.charter?.resources || 
                                'Directions: Detail the clinical setting where this quality improvement project was executed (e.g. inpatient internal medicine wards, outpatient clinics, emergency department triage) and local patient populations.',
                            italics: !project.charter?.resources,
                            color: project.charter?.resources ? '0F172A' : '64748B',
                            font: 'Calibri'
                        })
                    ]
                }),

                new Paragraph({
                    heading: HeadingLevel.HEADING_2,
                    children: [new TextRun({ text: '2. Interventions (PDSA Cycles Executed)' })]
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Methodology: PDSA (Plan-Do-Study-Act) cycle iteration ${project.pdsa_cycle} was initiated.\n`,
                            bold: true,
                            font: 'Calibri'
                        }),
                        new TextRun({
                            text: project.updates_and_barriers || 
                                'Directions: Elaborate on specific workflow interventions implemented during this cycle. Document barriers, adjustments made on the fly, and staff engagement protocols.',
                            italics: !project.updates_and_barriers,
                            color: project.updates_and_barriers ? '0F172A' : '64748B',
                            font: 'Calibri'
                        })
                    ]
                }),

                new Paragraph({
                    heading: HeadingLevel.HEADING_2,
                    children: [new TextRun({ text: '3. Measures (Project Analytical Metrics)' })]
                }),
                new Paragraph({
                    spacing: { after: 120 },
                    children: [
                        new TextRun({
                            text: 'The following cumulative data series represents process, outcome, or balancing measures tracked in the GME registry dashboard for clinical analysis:',
                            font: 'Calibri'
                        })
                    ]
                }),

                // Programmatically generate a styled metrics table
                metrics.length === 0 
                    ? new Paragraph({
                        children: [
                            new TextRun({
                                text: '  - No quantitative analytical metrics uploaded to this project registry yet.',
                                italics: true,
                                color: '64748B',
                                font: 'Calibri'
                            })
                        ]
                    })
                    : new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            // Table Header Row
                            new TableRow({
                                children: [
                                    new TableCell({
                                        shading: { fill: '1E3A8A' },
                                        margins: { top: 100, bottom: 100, left: 100, right: 100 },
                                        children: [
                                            new Paragraph({
                                                alignment: AlignmentType.CENTER,
                                                children: [
                                                    new TextRun({ text: 'Metric Indicator', bold: true, color: 'FFFFFF', font: 'Arial', size: 18 })
                                                ]
                                            })
                                        ]
                                    }),
                                    new TableCell({
                                        shading: { fill: '1E3A8A' },
                                        margins: { top: 100, bottom: 100, left: 100, right: 100 },
                                        children: [
                                            new Paragraph({
                                                alignment: AlignmentType.CENTER,
                                                children: [
                                                    new TextRun({ text: 'Reporting Month', bold: true, color: 'FFFFFF', font: 'Arial', size: 18 })
                                                ]
                                            })
                                        ]
                                    }),
                                    new TableCell({
                                        shading: { fill: '1E3A8A' },
                                        margins: { top: 100, bottom: 100, left: 100, right: 100 },
                                        children: [
                                            new Paragraph({
                                                alignment: AlignmentType.CENTER,
                                                children: [
                                                    new TextRun({ text: 'Registered Value', bold: true, color: 'FFFFFF', font: 'Arial', size: 18 })
                                                ]
                                            })
                                        ]
                                    })
                                ]
                            }),
                            // Table Body Rows
                            ...metrics.map((m, idx) => new TableRow({
                                children: [
                                    new TableCell({
                                        shading: { fill: idx % 2 === 0 ? 'F8FAFC' : 'FFFFFF' },
                                        margins: { top: 80, bottom: 80, left: 100, right: 100 },
                                        children: [
                                            new Paragraph({
                                                children: [
                                                    new TextRun({ text: m.label, font: 'Calibri', size: 18 })
                                                ]
                                            })
                                        ]
                                    }),
                                    new TableCell({
                                        shading: { fill: idx % 2 === 0 ? 'F8FAFC' : 'FFFFFF' },
                                        margins: { top: 80, bottom: 80, left: 100, right: 100 },
                                        children: [
                                            new Paragraph({
                                                alignment: AlignmentType.CENTER,
                                                children: [
                                                    new TextRun({ text: m.month, font: 'Calibri', size: 18 })
                                                ]
                                            })
                                        ]
                                    }),
                                    new TableCell({
                                        shading: { fill: idx % 2 === 0 ? 'F8FAFC' : 'FFFFFF' },
                                        margins: { top: 80, bottom: 80, left: 100, right: 100 },
                                        children: [
                                            new Paragraph({
                                                alignment: AlignmentType.CENTER,
                                                children: [
                                                    new TextRun({ text: String(m.value), bold: true, font: 'Calibri', size: 18, color: '1E3A8A' })
                                                ]
                                            })
                                        ]
                                    })
                                ]
                            }))
                        ]
                    }),

                new Paragraph({ text: '', spacing: { after: 240 } }),

                // --- SQUIRE SECTION 4: RESULTS ---
                new Paragraph({ text: 'Section IV: Results', heading: HeadingLevel.HEADING_1 }),
                
                new Paragraph({
                    heading: HeadingLevel.HEADING_2,
                    children: [new TextRun({ text: '1. Summary Outcomes' })]
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'Directions: Provide a comprehensive chronological summary of your results. Mention specific percentage drops in safety failures, post-intervention compliance rates, and statistical p-values confirmed by your statistics advisor.',
                            italics: true,
                            color: '64748B',
                            font: 'Calibri'
                        })
                    ]
                }),

                // --- SQUIRE SECTION 5: DISCUSSION & CONCLUSIONS ---
                new Paragraph({ text: 'Section V: Discussion', heading: HeadingLevel.HEADING_1 }),
                
                new Paragraph({
                    heading: HeadingLevel.HEADING_2,
                    children: [new TextRun({ text: '1. Major Findings & Conclusions' })]
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'Directions: Compare your local outcomes with published literature on this clinical subject. Discuss core limitations (e.g. resident compliance, EHR database filters), operational balancing measures, and planned sustainability procedures.',
                            italics: true,
                            color: '64748B',
                            font: 'Calibri'
                        })
                    ]
                })
            ]
        }]
    })

    // 2. Generate and download Blob using FileSaver
    const blob = await Packer.toBlob(doc)
    saveAs(blob, `SQUIRE_2.0_Draft_${project.title.replace(/\s+/g, '_')}.docx`)
}
