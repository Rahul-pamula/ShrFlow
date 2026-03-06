"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/**
 * Template ID route – always redirects to the structured block editor.
 */
export default function TemplateRouterPage() {
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
