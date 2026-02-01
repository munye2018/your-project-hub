import { useCallback, useRef, useEffect } from 'react';

const NOTIFICATION_SOUND_URL = '/sounds/notification.mp3';
const HIGH_VALUE_SOUND_URL = '/sounds/high-value.mp3';

export function useNotificationSound(soundEnabled: boolean = true) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const highValueAudioRef = useRef<HTMLAudioElement | null>(null);

  // Preload audio files
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
      audioRef.current.preload = 'auto';
      
      highValueAudioRef.current = new Audio(HIGH_VALUE_SOUND_URL);
      highValueAudioRef.current.preload = 'auto';
    }

    return () => {
      audioRef.current = null;
      highValueAudioRef.current = null;
    };
  }, []);

  const playNotificationSound = useCallback((isHighValue: boolean = false) => {
    if (!soundEnabled) return;

    const audio = isHighValue ? highValueAudioRef.current : audioRef.current;
    
    if (audio) {
      // Reset to beginning if already playing
      audio.currentTime = 0;
      audio.volume = 0.5;
      
      audio.play().catch((error) => {
        // Browser may block autoplay - this is expected
        console.log('Audio playback blocked:', error.message);
      });
    }
  }, [soundEnabled]);

  const playForNotification = useCallback((notificationType: string) => {
    const isHighValue = notificationType === 'high_value';
    playNotificationSound(isHighValue);
  }, [playNotificationSound]);

  return {
    playNotificationSound,
    playForNotification,
  };
}
