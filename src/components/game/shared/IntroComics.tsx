import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ComicSlideProps {
  images: string[];
  texts: string[];
  onComplete?: () => void;
}

const ComicSlide: React.FC<ComicSlideProps> = ({ images, texts, onComplete }) => {
  const [visiblePanels, setVisiblePanels] = useState<number[]>([]);
  const [imagesPreloaded, setImagesPreloaded] = useState<{ [key: number]: boolean }>({});
  
  useEffect(() => {
    let timeouts: NodeJS.Timeout[] = [];
    
    // Reset states when images prop changes
    setVisiblePanels([]);
    setImagesPreloaded({});

    // Schedule each panel to appear
    images.forEach((_, index) => {
      const timer = setTimeout(() => {
        setVisiblePanels(prev => [...prev, index]);
        
        // If this was the last panel, wait and then complete
        if (index === images.length - 1) {
          const completeTimer = setTimeout(() => {
            onComplete?.();
          }, 3000);
          timeouts.push(completeTimer);
        }
      }, index * 3000); // Show each panel 3 seconds after the previous
      
      timeouts.push(timer);
    });

    return () => {
      // Cleanup all timeouts
      timeouts.forEach(clearTimeout);
      setVisiblePanels([]);
    };
  }, [images.length, onComplete, images]);

  const handleImageLoad = (index: number) => {
    setImagesPreloaded(prev => ({ ...prev, [index]: true }));
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto h-full p-4 bg-black">
      {images.map((img, index) => (
        <React.Fragment key={index}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: visiblePanels.includes(index) ? 1 : 0 }}
            transition={{ duration: 1 }}
            className="w-full h-[200px] flex items-center justify-center bg-gray-900 rounded-lg overflow-hidden border-2 border-amber-900/30"
            style={{ boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)' }}
          >
            <img 
              src={img} 
              alt={`panel-${index}`} 
              className="object-cover w-full h-full"
              onLoad={() => handleImageLoad(index)}
            />
          </motion.div>
          {index < images.length - 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: visiblePanels.includes(index) ? 1 : 0 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="text-amber-500 text-lg text-center italic px-4"
            >
              {texts[index]}
            </motion.div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const IntroComics: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [slideIndex, setSlideIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const slidesContent = [
    {
      images: [
        "https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=800&h=600", // Dark fantasy castle
        "https://images.unsplash.com/photo-1533069027836-fa937181a8ce?w=800&h=600", // Magic fire
        "https://images.unsplash.com/photo-1505673542670-a5e3ff5b14a3?w=800&h=600"  // Mystic forest
      ],
      texts: [
        "In a realm shrouded in ancient magic...",
        "A power long forgotten awakens..."
      ]
    },
    {
      images: [
        "https://images.unsplash.com/photo-1534445967719-8ae7b972b1a9?w=800&h=600", // Dark castle interior
        "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&h=600", // Magical portal
        "https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?w=800&h=600"  // Epic landscape
      ],
      texts: [
        "Heroes rise to face the darkness...",
        "Their destiny lies in the cards..."
      ]
    }
  ];

  const handleSlideComplete = () => {
    if (slideIndex < slidesContent.length - 1) {
      setIsTransitioning(true);
      // Wait for 1 second of black screen before showing next slide
      setTimeout(() => {
        setSlideIndex(slideIndex + 1);
        setIsTransitioning(false);
      }, 1000);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-black">
      {/* Loading state */}
      {!slidesContent[slideIndex] && (
        <div className="text-amber-500 animate-pulse">
          Loading...
        </div>
      )}
      <motion.div
        animate={{ opacity: isTransitioning ? 0 : 1 }}
        transition={{ duration: 0.5 }}
      >
        <ComicSlide 
          images={slidesContent[slideIndex].images}
          texts={slidesContent[slideIndex].texts}
          onComplete={handleSlideComplete}
        />
      </motion.div>
    </div>
  );
};

export default IntroComics;
