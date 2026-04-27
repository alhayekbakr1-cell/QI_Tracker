import { Configuration, PublicClientApplication } from "@azure/msal-browser";

// Configuration object to be passed to MSAL instance on creation. 
// For a full list of MSAL.js configuration parameters, visit:
// https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/configuration.md 
export const msalConfig: Configuration = {
    auth: {
        clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || "",
        authority: "https://login.microsoftonline.com/common", // "common" for both organizational and personal accounts
        redirectUri: "/", // Points to window.location.origin
        postLogoutRedirectUri: "/"
    },
    cache: {
        cacheLocation: "sessionStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    },
};

// Add here scopes for id token to be used at MS Identity Platform endpoints.
export const loginRequest = {
    scopes: ["User.Read", "Files.ReadWrite", "Files.ReadWrite.All"]
};

export const msalInstance = new PublicClientApplication(msalConfig);
