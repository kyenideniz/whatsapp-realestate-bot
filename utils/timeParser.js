import { Chrono } from 'chrono-node';

export function parseAvailableTime(userInput, availableTimes) {
  const referenceDate = new Date();
  const results = Chrono.parse(userInput, referenceDate, { 
    forwardDate: true,
    impliedTime: true
  });

  if (results.length === 0) return null;

  const parsedDate = results[0].start.date();
  
  // Find closest matching time slot
  return availableTimes.reduce((closest, time) => {
    const slotDate = new Date(time);
    const diff = Math.abs(slotDate - parsedDate);
    
    if (diff < closest.diff) {
      return { time, diff };
    }
    return closest;
  }, { time: null, diff: Infinity }).time;
}