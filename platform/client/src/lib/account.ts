const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export interface AccountWorkspace {
    tenant_id: string;
    workspace_name: string;
    role: string;
    status: string;
    workspace_type: string;
    onboarding_required: boolean;
    plan: string;
    is_last_active: boolean;
}

interface LegacyWorkspace {
    tenant_id: string;
    company_name: string;
    role: string;
    status: string;
}

function normalizeLegacyWorkspace(workspace: LegacyWorkspace): AccountWorkspace {
    return {
        tenant_id: workspace.tenant_id,
        workspace_name: workspace.company_name || 'Workspace',
        role: workspace.role || 'viewer',
        status: workspace.status || 'active',
        workspace_type: 'MAIN',
        onboarding_required: workspace.status === 'onboarding',
        plan: 'Free',
        is_last_active: false,
    };
}

export async function fetchAccountWorkspaces(authToken: string): Promise<AccountWorkspace[]> {
    const headers = { Authorization: `Bearer ${authToken}` };
    let lastError: Error | null = null;

    // 1. Try modern account API
    try {
        const res = await fetch(`${API_BASE}/account/workspaces`, { headers });
        if (res.ok) {
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        }
        
        // If not OK, try to extract error detail
        try {
            const payload = await res.json();
            if (payload.detail) throw new Error(payload.detail);
        } catch (e) {
            if (res.status === 404) {
                // Ignore 404 and fallback to legacy
            } else {
                throw new Error(`Account API failed with status ${res.status}`);
            }
        }
    } catch (err: any) {
        console.warn('[Account API Fallback] Modern workspaces endpoint failed:', err.message);
        lastError = err;
    }

    // 2. Fallback to legacy auth API
    try {
        const res = await fetch(`${API_BASE}/auth/workspaces`, { headers });
        if (res.ok) {
            const data = await res.json();
            return Array.isArray(data) ? data.map(normalizeLegacyWorkspace) : [];
        }

        try {
            const payload = await res.json();
            if (payload.detail) throw new Error(payload.detail);
        } catch {}
        
        throw new Error(`Legacy API failed with status ${res.status}`);
    } catch (err: any) {
        console.error('[Account API Error] Both modern and legacy endpoints failed:', err.message);
        throw new Error(err.message || lastError?.message || 'Failed to load workspaces. Please check your connection.');
    }
}
