import { Configuration, PopupRequest } from "@azure/msal-browser";

export const msalConfig: Configuration = {
    auth: {
        clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || "",
        authority: "https://login.microsoftonline.com/common",
        redirectUri: typeof window !== "undefined" ? window.location.origin + "/QI_Tracker" : "",
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
    } as any,
};

// Scopes for OneDrive access
export const loginRequest: PopupRequest = {
    scopes: ["User.Read", "Files.ReadWrite", "Files.ReadWrite.All"]
};

export const graphConfig = {
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
    graphDriveEndpoint: "https://graph.microsoft.com/v1.0/me/drive/root"
};
