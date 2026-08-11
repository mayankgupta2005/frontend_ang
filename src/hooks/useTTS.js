import { useState, useEffect, useCallback } from 'react';

export function useTTS() {
  const [ttsEnabled, setTtsEnabled] = useState(() => {
    return localStorage.getItem('novashield_tts') === 'true';
  });

  const toggleTTS = useCallback(() => {
    const nextState = !ttsEnabled;
    setTtsEnabled(nextState);
    localStorage.setItem('novashield_tts', nextState);
    if (nextState) {
      announce("Voice assistant enabled", true);
    } else {
      announce("Voice assistant disabled", true);
    }
  }, [ttsEnabled]);

  const announce = useCallback((message, force = false, priority = 'polite') => {
    if (!force && !ttsEnabled) return;

    // Update ARIA live regions
    const politeLive = document.getElementById('aria-live-polite');
    const assertiveLive = document.getElementById('aria-live-assertive');
    if (priority === 'assertive' && assertiveLive) assertiveLive.textContent = message;
    else if (politeLive) politeLive.textContent = message;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, [ttsEnabled]);

  // Hook to bind interactive elements
  useEffect(() => {
    if (!ttsEnabled) return;

    let debounceTimeout;
    const handleFocus = (e) => {
      const el = e.target;
      if (el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'SELECT' || el.getAttribute('role') === 'tab') {
        const text = el.getAttribute('aria-label') || el.innerText || el.value;
        if (text && text.trim() !== '') {
          clearTimeout(debounceTimeout);
          debounceTimeout = setTimeout(() => announce(text.trim()), 300);
        }
      }
    };

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('mouseover', handleFocus); // Treat hover like focus for TTS

    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('mouseover', handleFocus);
    };
  }, [ttsEnabled, announce]);

  return { ttsEnabled, toggleTTS, announce };
}
