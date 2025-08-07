import { useState } from 'react';

export const useSelectionState = () => {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [selectedReplaceCard, setSelectedReplaceCard] = useState<string | null>(null);
  const [selectedPassive, setSelectedPassive] = useState<string | null>(null);

  const resetSelections = () => {
    setSelectedClass(null);
    setSelectedCard(null);
    setSelectedReplaceCard(null);
    setSelectedPassive(null);
  };

  return {
    selectedClass,
    setSelectedClass,
    selectedCard,
    setSelectedCard,
    selectedReplaceCard,
    setSelectedReplaceCard,
    selectedPassive,
    setSelectedPassive,
    resetSelections
  };
};