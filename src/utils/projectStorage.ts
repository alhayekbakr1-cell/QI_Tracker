"use client"

import { createClient } from "./supabase/client";

/**
 * In-app file storage for project documents.
 *
 * Files previously went only to OneDrive through Microsoft Graph, inside a
 * try/catch that logs "Direct OneDrive upload bypassed or blocked". On failure
 * the project_files row was still written with file_url = NULL, so a generated
 * protocol existed only in the Downloads folder of whoever produced it —
 * unreachable for the mentor, the programme, or the resident on another machine.
 *
 * Everything here targets the private `project-files` bucket. Who can read what
 * is enforced in the database (see the project_file_storage migration), not
 * here: uploader, residents on the project, the project's faculty mentor, and
 * Operator/Admin. Downloads always go through short-lived signed URLs.
 */

export const PROJECT_FILES_BUCKET = "project-files";

/** Paths are "<project_id>/<filename>" — the RLS policy reads the project id from the first segment. */
export function buildStoragePath(projectId: string, fileName: string): string {
    // Strip anything that would create nested folders or escape the project prefix.
    const safe = fileName.replace(/[/\\]+/g, "_").replace(/\s+/g, "_");
    return `${projectId}/${safe}`;
}

export interface StoredFile {
    storagePath: string;
    fileName: string;
}

/**
 * Uploads a file for a project. Upserts, so re-exporting a protocol replaces the
 * previous copy rather than accumulating near-duplicates.
 */
export async function uploadProjectFile(
    projectId: string,
    fileName: string,
    body: Blob | File,
    contentType?: string
): Promise<StoredFile> {
    const supabase = createClient();
    const storagePath = buildStoragePath(projectId, fileName);

    const { error } = await supabase.storage
        .from(PROJECT_FILES_BUCKET)
        .upload(storagePath, body, {
            upsert: true,
            contentType: contentType || (body as File).type || "application/octet-stream",
        });

    if (error) throw new Error(`Could not store the file: ${error.message}`);
    return { storagePath, fileName };
}

/**
 * Returns a temporary download URL. The bucket is private, so there is no
 * permanent public link — the URL is signed and expires.
 */
export async function getProjectFileUrl(storagePath: string, expiresInSeconds = 300): Promise<string> {
    const supabase = createClient();
    const { data, error } = await supabase.storage
        .from(PROJECT_FILES_BUCKET)
        .createSignedUrl(storagePath, expiresInSeconds);

    if (error || !data?.signedUrl) {
        throw new Error(`Could not create a download link: ${error?.message ?? "unknown error"}`);
    }
    return data.signedUrl;
}

/** Triggers a browser download for a stored file. */
export async function downloadProjectFile(storagePath: string, fileName?: string): Promise<void> {
    const url = await getProjectFileUrl(storagePath);
    const a = document.createElement("a");
    a.href = url;
    if (fileName) a.download = fileName;
    a.rel = "noopener";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    a.remove();
}

/** Removes a stored file. The policy restricts this to Operator/Admin. */
export async function deleteProjectFile(storagePath: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.storage.from(PROJECT_FILES_BUCKET).remove([storagePath]);
    if (error) throw new Error(`Could not delete the file: ${error.message}`);
}
