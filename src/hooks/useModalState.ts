import { useState } from 'react';

export const useModalState = () => {
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  const openDeckModal = () => setShowDeckModal(true);
  const closeDeckModal = () => setShowDeckModal(false);
  const openDiscardModal = () => setShowDiscardModal(true);
  const closeDiscardModal = () => setShowDiscardModal(false);

  return {
    showDeckModal,
    showDiscardModal,
    openDeckModal,
    closeDeckModal,
    openDiscardModal,
    closeDiscardModal,
    setShowDeckModal,
    setShowDiscardModal
  };
};