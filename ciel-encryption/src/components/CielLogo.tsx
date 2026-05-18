export default function CielLogo({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Nuage Bleu (Sécurité Cloud) */}
      <path
        d="M40 50C40 42 46 36 54 36C56 30 63 26 70 26C80 26 88 33 88 42C95 42 100 47 100 54C100 61 95 66 88 66H40C33 66 28 61 28 54C28 47 33 42 40 42V50Z"
        fill="#38bdf8"
      />
      <circle cx="64" cy="46" r="6" fill="white" />
      <rect x="62" y="52" width="4" height="6" fill="white" />

      {/* Texte BTS */}
      <text x="10" y="30" fill="white" fontFamily="sans-serif" fontWeight="900" fontSize="16">
        BTS
      </text>

      {/* Drone (Surveillance Aérienne) */}
      <rect x="35" y="62" width="25" height="4" rx="2" fill="#0f172a" />
      <path d="M47.5 66V72" stroke="#0f172a" strokeWidth="2" />
      <circle cx="35" cy="62" r="3" fill="#38bdf8" />
      <circle cx="60" cy="62" r="3" fill="#38bdf8" />

      {/* Ondes du drone */}
      <path
        d="M38 75C42 78 53 78 57 75"
        stroke="#38bdf8"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M35 80C42 84 53 84 60 80"
        stroke="#38bdf8"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />

      {/* Smartphone (Contrôle Mobile) */}
      <rect x="75" y="55" width="20" height="35" rx="3" fill="#0f172a" stroke="white" strokeWidth="1" />
      <rect x="78" y="58" width="14" height="25" fill="#f8fafc" opacity="0.2" />
      <path d="M80 65L85 75L90 68" stroke="#38bdf8" strokeWidth="1" />

      {/* Texte CIEL [IR] */}
      <text x="35" y="105" fill="white" fontFamily="sans-serif" fontWeight="900" fontSize="18">
        CIEL [IR]
      </text>
    </svg>
  );
}
