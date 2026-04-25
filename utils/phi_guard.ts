/**
 * PHI Privacy Guard Utility
 * 
 * Detects common PHI patterns (MRNs, SSNs, and Date formats) 
 * to prevent accidental transmission to AI models.
 */

const PHI_PATTERNS = {
    // Medical Record Numbers (Common institutional formats: 000-00-00, 7-9 digits)
    MRN: /\b\d{3}-\d{2}-\d{2}\b|\b\d{7,9}\b/g,

    // Social Security Numbers (9 digits)
    SSN: /\b\d{3}-\d{2}-\d{4}\b/g,

    // Dates of Birth or surgery dates (MM/DD/YYYY, YYYY-MM-DD, etc.)
    // We try to be careful not to redact non-PHI years.
    DATE: /\b(0[1-9]|1[0-2])[\/.-](0[1-9]|[12][0-9]|3[01])[\/.-](19|20)\d{2}\b/g,

    // Email patterns (if not institutional)
    EMAIL: /\b[A-Za-z0-9._%+-]+@(?!(adventhealth\.com))[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
};

/**
 * Scans text for PHI and returns a list of matches.
 */
export const scanForPHI = (text: string) => {
    const findings: { type: string; value: string }[] = [];

    Object.entries(PHI_PATTERNS).forEach(([type, pattern]) => {
        const matches = text.match(pattern);
        if (matches) {
            matches.forEach(match => {
                findings.push({ type, value: match });
            });
        }
    });

    return findings;
};

/**
 * Redacts PHI from text with labels like [REDACTED MRN].
 */
export const redactPHI = (text: string) => {
    let redactedText = text;

    Object.entries(PHI_PATTERNS).forEach(([type, pattern]) => {
        redactedText = redactedText.replace(pattern, `[REDACTED ${type}]`);
    });

    return redactedText;
};

/**
 * Returns true if the text contains any potential PHI.
 */
export const hasPotentialPHI = (text: string) => {
    return scanForPHI(text).length > 0;
};
