import React from 'react';
import { formatCardDescription } from '@/lib/gameUtils';

interface CardEffectTextProps {
  description: string;
  className?: string;
}

export const CardEffectText: React.FC<CardEffectTextProps> = ({ description, className = '' }) => {
  const formattedDescription = formatCardDescription(description);
  
  return (
    <span className={className}>
      {formattedDescription}
    </span>
  );
};