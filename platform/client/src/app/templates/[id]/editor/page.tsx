"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/**
 * Legacy editor route – redirects to the new structured block editor.
 */
export default function LegacyEditorRedirect() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    useEffect(() => {
        router.replace(`/templates/${id}/block`);
    }, [id, router]);

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "#666" }}>
            Redirecting to editor…
        </div>
    );
}
