import React from 'react';
import { GraduationCap, School, BookOpen, Users, Award, Landmark } from 'lucide-react';

interface AvatarFallbackProps {
  src?: string | null;
  alt?: string;
  name?: string; // used to generate initials or title context
  role?: string | null; // optional role to pick persona emblem
  size?: number; // pixel size, default 32
  className?: string;
}

/**
 * Premium Educational Avatar Fallback:
 * Replaces childish/empty letters with dignified, persona-specific educational emblems and academic crests.
 * Features an elegant Algerian Mediterranean motif with neon cyan/teal/gold radiant accents.
 */
export const AvatarFallback: React.FC<AvatarFallbackProps> = ({
  src,
  alt = 'Avatar',
  name = '',
  role,
  size = 32,
  className = '',
}) => {
  if (src && src.trim() !== '') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        className={className}
        style={{ borderRadius: size > 48 ? '1.25rem' : '0.85rem', objectFit: 'cover' }}
      />
    );
  }

  const cleanName = name.trim();
  const iconSize = Math.max(14, Math.floor(size * 0.46));
  const isTeacher = role === 'TEACHER' || role === 'ACADEMIC' || cleanName.startsWith('أستاذ') || cleanName.startsWith('د.');
  const isInstitution = role === 'INSTITUTION' || cleanName.includes('معهد') || cleanName.includes('مدرسة') || cleanName.includes('ثانوية');
  const isParent = role === 'PARENT' || cleanName.includes('ولي');

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size > 48 ? '1.25rem' : '0.85rem',
      }}
      className={`relative overflow-hidden bg-gradient-to-br from-[#0F3854] via-[#0A263B] to-[#061826] border border-sky-400/40 shadow-inner flex items-center justify-center select-none shrink-0 group ${className}`}
    >
      {/* Subtle academic geometric background pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="50" r="40" stroke="#38BDF8" strokeWidth="2" strokeDasharray="4 4" />
        <path d="M50 10 L90 50 L50 90 L10 50 Z" stroke="#2DD4BF" strokeWidth="1.5" />
      </svg>

      {/* Dignified Persona-Specific Academic Emblem */}
      {isTeacher ? (
        <Award style={{ width: iconSize, height: iconSize }} className="text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)] z-10" />
      ) : isInstitution ? (
        <Landmark style={{ width: iconSize, height: iconSize }} className="text-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)] z-10" />
      ) : isParent ? (
        <Users style={{ width: iconSize, height: iconSize }} className="text-teal-300 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)] z-10" />
      ) : (
        <GraduationCap style={{ width: iconSize, height: iconSize }} className="text-cyan-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)] z-10" />
      )}
    </div>
  );
};

export default AvatarFallback;
