import { SVGProps } from 'react';

interface LogoProps extends SVGProps<SVGSVGElement> {
    className?: string;
}

export function Logo({ className, ...props }: LogoProps) {
    return (
        <svg
            viewBox="0 0 100 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            {...props}
        >
            {/* Base Blue Infinity Loop */}
            <path
                d="M 12.5 25 C 12.5 37.5, 37.5 37.5, 50 25 C 62.5 12.5, 87.5 12.5, 87.5 25 C 87.5 37.5, 62.5 37.5, 50 25 C 37.5 12.5, 12.5 12.5, 12.5 25 Z"
                stroke="#2558d9"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Symmetrical Green Crossover Diagonal Overlay (starts at bottom-left, crosses top-right) */}
            <path
                d="M 12.5 25 C 12.5 37.5, 37.5 37.5, 50 25 C 62.5 12.5, 87.5 12.5, 87.5 25 C 87.5 37.5, 62.5 37.5, 50 25 C 37.5 12.5, 12.5 12.5, 12.5 25 Z"
                stroke="#10b981"
                strokeWidth="12"
                strokeLinecap="butt"
                strokeDasharray="42.5 200"
                strokeDashoffset="-21.25"
            />
        </svg>
    );
}
