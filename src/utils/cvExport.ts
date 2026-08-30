import jsPDF from "jspdf";
import { Project } from "@/types";

/**
 * Exports a resident's scholarly work as a CV section.
 *
 * Distinct from the existing board certification letter: that attests
 * milestones to the GME office, whereas this is material a resident pastes into
 * a fellowship application — projects, role, aims, cycles and dissemination,
 * formatted as an academic CV rather than a letter.
 */

const NAVY: [number, number, number] = [0, 79, 159];
const SLATE: [number, number, number] = [71, 85, 105];
const LIGHT: [number, number, number] = [148, 163, 184];

export function downloadScholarlyCV(opts: {
    residentName: string;
    projects: Project[];
}) {
    const { residentName, projects } = opts;

    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
    doc.setProperties({
        title: `Scholarly Activity - ${residentName}`,
        subject: "Quality Improvement and Research Portfolio",
        author: residentName,
        creator: "Athena Clinical Wisdom Registry",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 56;
    const maxWidth = pageWidth - margin * 2;
    let y = margin;

    // Page-break helper. Without this, a resident with more than a couple of
    // projects silently lost everything past the first page.
    const ensureSpace = (needed: number) => {
        if (y + needed > pageHeight - margin) {
            doc.addPage();
            y = margin;
        }
    };

    const line = (text: string, size: number, style: "normal" | "bold" | "italic", color: [number, number, number], gap = 4) => {
        doc.setFont("helvetica", style);
        doc.setFontSize(size);
        doc.setTextColor(...color);
        const wrapped = doc.splitTextToSize(text, maxWidth);
        ensureSpace(wrapped.length * (size + 3));
        doc.text(wrapped, margin, y);
        y += wrapped.length * (size + 3) + gap;
    };

    // Header
    line(residentName, 20, "bold", [15, 23, 42], 2);
    line("Quality Improvement & Scholarly Activity", 11, "normal", SLATE, 10);
    doc.setDrawColor(...NAVY);
    doc.setLineWidth(1.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 18;

    if (projects.length === 0) {
        line("No scholarly projects are currently registered.", 10, "italic", LIGHT);
        doc.save(`Scholarly_Activity_${residentName.replace(/\s+/g, "_")}.pdf`);
        return;
    }

    // Sort so completed, most-developed work leads the section.
    const ordered = [...projects].sort(
        (a, b) => (Number(b.pdsa_cycle) || 0) - (Number(a.pdsa_cycle) || 0)
    );

    line(`QUALITY IMPROVEMENT PROJECTS (${ordered.length})`, 10, "bold", NAVY, 10);

    ordered.forEach((p, i) => {
        ensureSpace(70);
        line(`${i + 1}. ${p.title}`, 12, "bold", [15, 23, 42], 2);

        const meta = [
            p.category,
            p.status,
            p.faculty ? `Mentor: ${p.faculty}` : null,
        ].filter(Boolean).join("  ·  ");
        if (meta) line(meta, 9, "italic", LIGHT, 4);

        if (p.primary_outcome) {
            line(`Aim: ${p.primary_outcome}`, 10, "normal", SLATE, 3);
        }

        const cycles = Number(p.pdsa_cycle) || 0;
        const achievements = [
            cycles > 0 ? `${cycles} PDSA cycle${cycles === 1 ? "" : "s"} completed` : null,
            p.protocol_url ? "Protocol approved" : null,
            p.presentation_url ? "Presented" : null,
            p.target_conference ? `Submitted to ${p.target_conference}` : null,
        ].filter(Boolean);
        if (achievements.length) {
            line(achievements.join("  ·  "), 9, "normal", NAVY, 10);
        } else {
            y += 6;
        }
    });

    // Dissemination summary — the part fellowship reviewers scan for.
    const presented = ordered.filter(p => p.presentation_url);
    const conferences = Array.from(
        new Set(ordered.map(p => p.target_conference).filter(Boolean) as string[])
    );

    if (presented.length || conferences.length) {
        ensureSpace(60);
        y += 6;
        line("DISSEMINATION", 10, "bold", NAVY, 8);
        presented.forEach(p => line(`• Presented: ${p.title}`, 10, "normal", SLATE, 2));
        conferences.forEach(c => line(`• Conference submission: ${c}`, 10, "normal", SLATE, 2));
    }

    // Footer on every page, so a detached page is still attributable.
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(...LIGHT);
        doc.text(
            `Generated ${new Date().toLocaleDateString()} · AdventHealth GME · Page ${i} of ${pages}`,
            margin,
            pageHeight - 28
        );
    }

    doc.save(`Scholarly_Activity_${residentName.replace(/\s+/g, "_")}.pdf`);
}
