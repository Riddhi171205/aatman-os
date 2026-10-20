import React from 'react';
import { cn } from '@/lib/utils';

interface AlienGlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'purple';
  glowOnHover?: boolean;
  className?: string;
  key?: React.Key;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export function AlienGlassCard({
  children,
  className,
  variant = 'primary',
  glowOnHover = false,
  ...props
}: AlienGlassCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-xl overflow-hidden transition-all duration-300',
        variant === 'purple' ? 'alien-glass-purple' : 'alien-glass',
        glowOnHover && 'hover:shadow-[0_0_25px_rgba(0,245,212,0.15)] hover:border-[#00F5D4]/40 hover:scale-[1.01]',
        className
      )}
      {...props}
    >
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute top-0 left-0 w-[1px] h-full bg-gradient-to-b from-transparent via-primary/10 to-transparent" />
      <div className="relative z-10 p-4 h-full">
        {children}
      </div>
    </div>
  );
}
