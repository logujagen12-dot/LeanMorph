interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'w-9 h-9',
  md: 'w-11 h-11',
  lg: 'w-16 h-16',
};

export function BrandLogo({ size = 'md', className = '' }: BrandLogoProps) {
  return (
    <div className={`${sizes[size]} ${className} relative shrink-0 rounded-[28%] bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700 shadow-float flex items-center justify-center overflow-hidden`}>
      <div className="absolute -right-1 -top-2 h-1/2 w-1/2 rounded-full bg-white/25 blur-md" />
      <svg viewBox="0 0 48 48" className="relative h-[62%] w-[62%]" aria-hidden="true">
        <path d="M24 5c-8 0-14 5-14 13 0 5 2.5 8.5 6 11.5-1.4 3-2.7 6.3-2.7 9.5 0 2.4 1.8 4 4.2 4 2.1 0 3.8-1.2 5-3.1 1.2 1.9 2.9 3.1 5 3.1 2.4 0 4.2-1.6 4.2-4 0-3.2-1.3-6.5-2.7-9.5 3.5-3 6-6.5 6-11.5C38 10 32 5 24 5Z" fill="none" stroke="white" strokeWidth="3.2" strokeLinejoin="round" />
        <path d="M24 8v27M17 18c2.5 1.3 4.8 1.6 7 1.6s4.5-.3 7-1.6M17.5 27c2.2 1.1 4.4 1.4 6.5 1.4s4.3-.3 6.5-1.4" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </div>
  );
}
