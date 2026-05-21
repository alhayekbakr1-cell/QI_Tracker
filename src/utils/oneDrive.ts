"use client";

import type { IPublicClientApplication, AccountInfo } from "@azure/msal-browser";
import { loginRequest } from "./auth/msalConfig";

// Files land in: OneDrive → Research/03_QI/Shared Docs Folder/{projectName}/
const SHARED_FOLDER = ["Research", "03_QI", "Shared Docs Folder"];

async function getAccessToken(
    instance: IPublicClientApplication,
    account: AccountInfo
): Promise<string> {
    try {
        const res = await instance.acquireTokenSilent({ ...loginRequest, account });
        return res.accessToken;
    } catch {
        const res = await instance.acquireTokenPopup(loginRequest);
        return res.accessToken;
    }
}

function buildPath(projectName: string, fileName: string): string {
    const safeName = projectName.replace(/[/\\?%*:|"<>]/g, "-").trim() || "General";
    const segments = [...SHARED_FOLDER, safeName, `${Date.now()}_${fileName}`];
    return segments.map(s => encodeURIComponent(s)).join("/");
}

export interface OneDriveUploadResult {
    url: string;
    fileName: string;
}

export async function uploadToSharedFolder(
    instance: IPublicClientApplication,
    account: AccountInfo,
    projectName: string,
    fileName: string,
    fileBlob: Blob,
    mimeType: string
): Promise<OneDriveUploadResult> {
    const accessToken = await getAccessToken(instance, account);
    const path = buildPath(projectName, fileName);

    const uploadRes = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/root:/${path}:/content`,
        {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": mimeType || "application/octet-stream",
            },
            body: fileBlob,
        }
    );

    if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error(
            `OneDrive upload failed: ${err?.error?.message || uploadRes.statusText}`
        );
    }

    const item = await uploadRes.json();
    const driveItemId: string = item.id;
    const driveFileName: string = item.name;

    // Try org-scoped link first, fall back to anonymous
    for (const scope of ["organization", "anonymous"] as const) {
        const linkRes = await fetch(
            `https://graph.microsoft.com/v1.0/me/drive/items/${driveItemId}/createLink`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ type: "view", scope }),
            }
        );
        if (linkRes.ok) {
            const linkData = await linkRes.json();
            return { url: linkData.link.webUrl, fileName: driveFileName };
        }
    }

    return { url: item.webUrl, fileName: driveFileName };
}
