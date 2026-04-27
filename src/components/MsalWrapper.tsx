"use client";

import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "@/utils/auth/msalConfig";
import { ReactNode, useEffect, useState } from "react";

const msalInstance = new PublicClientApplication(msalConfig);

export default function MsalWrapper({ children }: { children: ReactNode }) {
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        msalInstance.initialize().then(() => {
            setInitialized(true);
        });
    }, []);

    if (!initialized) {
        return <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="animate-pulse text-advent-navy font-black uppercase tracking-widest text-xs">
                Initializing Microsoft Identity...
            </div>
        </div>;
    }

    return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
}
