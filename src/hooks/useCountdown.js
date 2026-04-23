import { useEffect, useState } from 'react';

export function useCountdown(endsAt) {
  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    function update() { setTimeLeft(Math.max(0, new Date(endsAt).getTime() - Date.now())); }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  return timeLeft;
}
