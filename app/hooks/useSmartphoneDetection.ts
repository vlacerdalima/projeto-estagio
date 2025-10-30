import { useState, useEffect } from 'react';

export function useSmartphoneDetection() {
  const [isSmartphone, setIsSmartphone] = useState(false);

  useEffect(() => {
    const checkSmartphone = () => {
      try {
        const width = window.innerWidth;
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isVerySmallScreen = width < 480;
        
        const userAgent = navigator.userAgent.toLowerCase();
        const isPhone = /android.*mobile|webos|iphone|ipod|blackberry|iemobile|opera.*mini/i.test(userAgent);
        const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent);
        
        const isPhoneDevice = isVerySmallScreen && isPhone && !isTablet && isTouch;
        setIsSmartphone(isPhoneDevice);
      } catch (error) {
        console.error('Erro ao verificar smartphone:', error);
      }
    };

    checkSmartphone();
    window.addEventListener('resize', checkSmartphone);
    return () => {
      try {
        window.removeEventListener('resize', checkSmartphone);
      } catch (error) {
        // Ignorar erro se listener já foi removido
      }
    };
  }, []);

  return isSmartphone;
}

