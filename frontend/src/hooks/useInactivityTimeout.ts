import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

const TIMEOUT_DURATION = 2 * 60 * 60 * 1000;
const WARNING_DURATION = 1 * 60 * 1000;

export function useInactivityTimeout(onLogout: () => void) {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const warningTimerRef = useRef<number | null>(null);
  const logoutTimerRef = useRef<number | null>(null);

  const performLogout = useCallback(() => {
    setShowModal(false);
    onLogout();
    navigate("/login", { replace: true });
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
  }, [onLogout, navigate]);

  const startLogoutTimer = useCallback(() => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    logoutTimerRef.current = window.setTimeout(() => {
      if (showModal) {
        performLogout();
      }
    }, WARNING_DURATION);
  }, [performLogout, showModal]);

  const startWarningTimer = useCallback(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    warningTimerRef.current = window.setTimeout(() => {
      setShowModal(true);
      startLogoutTimer();
    }, TIMEOUT_DURATION - WARNING_DURATION);
  }, [startLogoutTimer]);

  const resetTimers = useCallback(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    setShowModal(false);
    startWarningTimer();
  }, [startWarningTimer]);

  const handleContinue = useCallback(() => {
    setShowModal(false);
    resetTimers();
  }, [resetTimers]);

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    const handleActivity = () => {
      resetTimers();
    };

    resetTimers();

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    };
  }, [resetTimers]);

  return { showModal, handleContinue, handleLogout: performLogout };
}
