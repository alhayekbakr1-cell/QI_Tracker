"use client";

import { MsalProvider } from "@azure/msal-react";
import { msalInstance } from "@/utils/auth/msalConfig";
import { useEffect, useState } from "react";

export default function MsalWrapper({ children }: { children: React.ReactNode }) {
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const initializeMsal = async () => {
            try {
                await msalInstance.initialize();
                setIsInitialized(true);
            } catch (error) {
                console.error("MSAL initialization failed", error);
            }
        };
        initializeMsal();
    }, []);

    if (!isInitialized) {
        return <>{children}</>; // Render without MSAL until initialized, or show a loader
    }

    return (
        <MsalProvider instance={msalInstance}>
            {children}
        </MsalProvider>
    );
}
