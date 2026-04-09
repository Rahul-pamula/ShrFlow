import { fileURLToPath } from 'url';

/** @type {import('next').NextConfig} */
const __dirname = fileURLToPath(new URL('.', import.meta.url));

const nextConfig = {
    // Pin Turbopack's root to this client directory so it doesn't
    // fall back to /Users/pamula/package-lock.json as the workspace root.
    turbopack: {
        root: __dirname,
    },

    async redirects() {
        return [
            {
                source: '/onboarding/basic-info',
                destination: '/onboarding/workspace',
                permanent: true,
            },
            {
                source: '/onboarding/compliance',
                destination: '/onboarding/workspace',
                permanent: true,
            },
        ];
    },
};

export default nextConfig;
