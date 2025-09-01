import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ComicSlideProps {
  images: string[];
  onComplete?: () => void;
}

const ComicSlide: React.FC<ComicSlideProps> = ({ images, onComplete }) => {
  const [allImagesLoaded, setAllImagesLoaded] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(0);

  useEffect(() => {
    if (imagesLoaded === images.length) {
      setAllImagesLoaded(true);
      setTimeout(() => {
        onComplete?.();
      }, 4000); // Passa alla prossima slide dopo 4 secondi
    }
  }, [imagesLoaded, images.length, onComplete]);

  return (
    <div className="grid grid-rows-3 gap-4 w-full max-w-2xl mx-auto h-full p-4 bg-black">
      {images.map((img, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: allImagesLoaded ? 1 : 0 }}
          transition={{ delay: index * 0.5, duration: 1 }}
          className="w-full h-full flex items-center justify-center bg-gray-900 rounded-lg overflow-hidden border-2 border-amber-900/30"
          style={{ boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)' }}
        >
          <img 
            src={img} 
            alt={`panel-${index}`} 
            className="object-cover w-full h-full"
            onLoad={() => setImagesLoaded(prev => prev + 1)}
          />
        </motion.div>
      ))}
    </div>
  );
};

const IntroComics: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [slideIndex, setSlideIndex] = useState(0);

  const slides = [
    [
      "https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=800&h=600", // Dark fantasy castle
      "https://images.unsplash.com/photo-1578353022142-09264fd64359?w=800&h=600", // Mysterious ritual
      "https://images.unsplash.com/photo-1542751110-97427bbecf7a?w=800&h=600"  // Magic cards/symbols
    ],
    [
      "https://images.unsplash.com/photo-1612036782180-6f0822045d23?w=800&h=600", // Dark corridor
      "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&h=600", // Magical portal
      "https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?w=800&h=600"  // Epic landscape
    ]
  ];

  const handleSlideComplete = () => {
    if (slideIndex < slides.length - 1) {
      setSlideIndex(slideIndex + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black">
      <ComicSlide 
        images={slides[slideIndex]} 
        onComplete={handleSlideComplete}
      />
    </div>
  );
};

export default IntroComics;
