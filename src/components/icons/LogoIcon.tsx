const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ children, className, ...props }) => {
    return (
        <svg viewBox="0 0 350 80" xmlns="http://www.w3.org/2000/svg" className={className}>
            <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: '#3B82F6' }} />
                    <stop offset="100%" style={{ stopColor: '#10B981' }} />
                </linearGradient>
            </defs>
            <g>
                <path d="M10 20 H 60 L 70 30 V 70 H 20 L 10 60 V 20 Z" fill="#3B82F6" opacity="0.3" />
                <path d="M20 10 H 70 L 80 20 V 60 H 30 L 20 50 V 10 Z" fill="url(#grad1)" />
            </g>
            <text x="100" y="55" fontFamily="Inter, sans-serif" fontSize="48" fontWeight="bold" fill="currentColor">Stratum</text>
        </svg>
    );
}
export default LogoIcon;