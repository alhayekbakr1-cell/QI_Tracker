"use client"

export interface EBMPaper {
    id: string;
    title: string;
    authors: string;
    journal: string;
    date: string;
    url: string;
    abstract?: string;
}

/**
 * Thrown when a registry throttles us. Callers should tell the resident to wait
 * or switch registry, rather than blaming their connection.
 */
export class RegistryRateLimitError extends Error {
    constructor(registry: string) {
        super(`${registry} is rate limiting requests right now. Wait a few seconds and try again, or switch to PubMed.`);
        this.name = 'RegistryRateLimitError';
    }
}

/**
 * Semantic Scholar throttles hard — measured roughly 3 in 4 requests returning
 * 429 even with an API key on the free tier. PubMed, OpenAlex and
 * ClinicalTrials.gov were all 100% reliable in the same test, so only the
 * throttled path needs this.
 */
async function fetchWithRetry(
    url: string,
    init: RequestInit,
    registry: string,
    attempts = 3
): Promise<Response> {
    let lastStatus = 0;
    for (let i = 0; i < attempts; i++) {
        const response = await fetch(url, init);
        if (response.ok) return response;
        lastStatus = response.status;
        // Only 429 and 5xx are worth retrying; a 400 will fail identically.
        if (response.status !== 429 && response.status < 500) break;
        if (i < attempts - 1) {
            const delay = 700 * Math.pow(2, i) + Math.random() * 300;
            await new Promise(r => setTimeout(r, delay));
        }
    }
    if (lastStatus === 429) throw new RegistryRateLimitError(registry);
    throw new Error(`${registry} request failed (HTTP ${lastStatus}).`);
}

export async function searchPubMed(query: string): Promise<EBMPaper[]> {
    try {
        const searchRes = await fetch(
            `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(
                query
            )}&retmode=json&retmax=5`
        );
        if (!searchRes.ok) throw new Error('PubMed esearch failed');
        const searchData = await searchRes.json();
        const idList: string[] = searchData.esearchresult?.idlist || [];
        if (idList.length === 0) return [];

        const summaryRes = await fetch(
            `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${idList.join(
                ','
            )}&retmode=json`
        );
        if (!summaryRes.ok) throw new Error('PubMed esummary failed');
        const summaryData = await summaryRes.json();

        return idList
            .map(id => {
                const result = summaryData.result?.[id];
                if (!result) return null;
                const authors = result.authors
                    ? result.authors.map((a: any) => a.name).join(', ')
                    : 'Unknown Authors';
                return {
                    id,
                    title: result.title || 'No Title Available',
                    authors,
                    journal: result.source || 'Unknown Journal',
                    date: result.pubdate || result.sortpubdate || 'No Date',
                    url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
                };
            })
            .filter(Boolean) as EBMPaper[];
    } catch (err) {
        console.error('PubMed search failed:', err);
        throw err;
    }
}

export async function searchSemanticScholar(query: string): Promise<EBMPaper[]> {
    try {
        const apiKey = process.env.NEXT_PUBLIC_SEMANTIC_SCHOLAR_KEY || '';
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };
        if (apiKey) {
            headers['x-api-key'] = apiKey;
        }

        const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(
            query
        )}&limit=5&fields=title,authors,venue,year,url,abstract`;

        const response = await fetchWithRetry(url, { headers }, 'Semantic Scholar');
        const data = await response.json();
        const papers = data.data || [];

        return papers.map((paper: any) => {
            const authorsList = paper.authors 
                ? paper.authors.map((a: any) => a.name).join(', ')
                : 'Unknown Authors';
            return {
                id: paper.paperId || Math.random().toString(),
                title: paper.title || 'No Title Available',
                authors: authorsList,
                journal: paper.venue || 'No Venue Listed',
                date: paper.year ? paper.year.toString() : 'No Year',
                url: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
                abstract: paper.abstract || ''
            };
        });
    } catch (err) {
        console.error('Semantic Scholar search failed:', err);
        throw err;
    }
}

export async function searchOpenAlex(query: string): Promise<EBMPaper[]> {
    try {
        const priorityMail = process.env.NEXT_PUBLIC_OPENALEX_KEY || '';
        let url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per_page=5`;
        if (priorityMail && priorityMail.includes('@')) {
            url += `&mailto=${encodeURIComponent(priorityMail)}`;
        } else if (priorityMail) {
            url += `&api_key=${encodeURIComponent(priorityMail)}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('OpenAlex search failed');
        const data = await response.json();
        const results = data.results || [];

        return results.map((work: any) => {
            const authorsList = work.authorships
                ? work.authorships.map((a: any) => a.author.display_name).join(', ')
                : 'Unknown Authors';
            const sourceName = work.primary_location?.source?.display_name || 'No Source Listed';
            return {
                id: work.id || Math.random().toString(),
                title: work.title || 'No Title Available',
                authors: authorsList,
                journal: `${sourceName} (Citations: ${work.cited_by_count || 0})`,
                date: work.publication_year ? work.publication_year.toString() : 'No Date',
                url: work.doi || `https://openalex.org/${work.id.split('/').pop()}`
            };
        });
    } catch (err) {
        console.error('OpenAlex search failed:', err);
        throw err;
    }
}

export async function searchClinicalTrials(query: string): Promise<EBMPaper[]> {
    try {
        const res = await fetch(
            `https://clinicaltrials.gov/api/v2/studies?query.term=${encodeURIComponent(
                query
            )}&pageSize=5`
        );
        if (!res.ok) throw new Error('ClinicalTrials.gov search failed');
        const data = await res.json();
        const studies = data.studies || [];
        return studies.map((s: any) => {
            const proto = s.protocolSection || {};
            const idModule = proto.identificationModule || {};
            const sponsorModule = proto.sponsorCollaboratorsModule || {};
            const descModule = proto.descriptionModule || {};
            const designModule = proto.designModule || {};

            const nctId = idModule.nctId || 'Unknown NCTID';
            const title =
                idModule.officialTitle || idModule.briefTitle || 'No Title Available';
            const leadSponsor = sponsorModule.leadSponsor?.name || 'Unknown Sponsor';
            const phases = designModule.phases ? designModule.phases.join(', ') : 'N/A';

            return {
                id: nctId,
                title,
                authors: leadSponsor,
                journal: `Clinical Trial | Phase: ${phases}`,
                date: 'N/A',
                url: `https://clinicaltrials.gov/study/${nctId}`,
                abstract: descModule.briefSummary || ''
            };
        });
    } catch (err) {
        console.error('ClinicalTrials search failed:', err);
        throw err;
    }
}

export async function searchEBM(
    query: string,
    source: 'pubmed' | 'semanticscholar' | 'openalex' | 'clinicaltrials'
): Promise<EBMPaper[]> {
    if (source === 'pubmed') return searchPubMed(query);
    if (source === 'semanticscholar') return searchSemanticScholar(query);
    if (source === 'openalex') return searchOpenAlex(query);
    if (source === 'clinicaltrials') return searchClinicalTrials(query);
    return [];
}
