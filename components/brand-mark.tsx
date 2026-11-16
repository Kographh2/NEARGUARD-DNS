export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20 3.5 34 9.2v9.9c0 8.2-5.3 14.4-14 17.4-8.7-3-14-9.2-14-17.4V9.2L20 3.5Z"
        fill="url(#nearguard-shield)"
        stroke="rgb(52 211 153 / 0.7)"
        strokeWidth="1.4"
      />
      <path
        d="M13 20.2 18 25l9.5-10"
        stroke="#03120d"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient
          id="nearguard-shield"
          x1="8"
          y1="6"
          x2="32"
          y2="35"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#6ee7b7" />
          <stop offset="1" stopColor="#10b981" />
        </linearGradient>
      </defs>
    </svg>
  );
}
