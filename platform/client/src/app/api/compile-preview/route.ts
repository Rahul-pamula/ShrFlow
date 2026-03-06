import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
    try {
        const { design_json } = await req.json();

        // Pass the bearer token forward so the backend can verify the tenant
        const authHeader = req.headers.get("authorization");

        const response = await fetch(`${API_BASE}/templates/compile/preview`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(authHeader ? { Authorization: authHeader } : {}),
            },
            body: JSON.stringify({ design_json }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({ error: "Backend compilation failed", details: errorText }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Compile Preview Proxy Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
