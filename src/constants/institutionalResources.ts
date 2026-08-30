/**
 * AdventHealth internal resources for residents.
 *
 * These live behind the AdventHealth tenant, so they only open for someone
 * signed in with their institutional account — which every resident and faculty
 * member here has. Add to this list rather than hardcoding links into the page.
 */

export interface InstitutionalResource {
    label: string;
    description: string;
    href: string;
    /** Shown when a link needs the AdventHealth network or a tenant sign-in. */
    requiresSignIn?: boolean;
}

export const INSTITUTIONAL_RESOURCES: InstitutionalResource[] = [
    {
        label: "GME Research Resource Hub",
        description:
            "The Center for Faculty Development's hub for research and scholarly activity — statistical support, IRB guidance, templates and submission routes.",
        href: "https://ahsonline.sharepoint.com/sites/CFD-gme/SitePages/Research-Resource-Hub.aspx",
        requiresSignIn: true,
    },
];
