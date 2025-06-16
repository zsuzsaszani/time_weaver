
// @ts-nocheck
'use server';

import type { DayOfWeek, PreferredTime } from '@/types';


export interface ScheduleInput {
  lifestyleAssessment: string;
  commitments: string;
  desiredActivities: string;
}

export interface ScheduleOutput {
  summaryLifestyle: string;
  summaryCommitments: string;
  summaryDesiredActivities: string;
  timetableHtml: string;
  suggestions: string;
}

export interface ScheduleAdjustmentsInput {
  lifestyleSummary: string;
  currentScheduleHtml: string;
  userGoals: string;
}

export interface ScheduleAdjustmentsOutput {
  suggestedAdjustments: string;
  rationale: string;
}

interface ParsedCommitment {
    name: string;
    dayTimes: { day: DayOfWeek; startTime: string; endTime: string }[];
}

interface ParsedActivity {
    name: string;
    durationHours: number;
    frequency: 'daily' | 'weekly';
    minDurationPerSession: number;
    maxDurationPerSession: number;
    preferredTime: PreferredTime;
}


const parseUserCommitments = (commitmentsString: string): ParsedCommitment[] => {
  const parsed: ParsedCommitment[] = [];
  if (!commitmentsString || commitmentsString.toLowerCase().includes("no fixed commitments specified")) {
    return parsed;
  }
  const commitmentEntries = commitmentsString.split(/\n\n+/);
  commitmentEntries.forEach(entry => {
    if (!entry.trim()) return;
    const nameMatch = entry.match(/^(.*?):/);
    if (!nameMatch || !nameMatch[1]) return;
    const name = nameMatch[1].trim();
    const dayTimes: ParsedCommitment["dayTimes"] = [];
    const daysAndTimesPart = entry.substring(name.length + 1).trim();
    const daySelectionRegex = /\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b(?:,\s*\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b)*/gi;
    let daysFound: DayOfWeek[] = [];
    const daySelectionMatch = daysAndTimesPart.match(daySelectionRegex);
    if (daySelectionMatch) {
        daysFound = daySelectionMatch[0].split(/,\s*/).map(d => d.trim() as DayOfWeek);
    }
    const uniformTimeMatch = daysAndTimesPart.match(/Uniform time:\s*(\d{2}:\d{2})\s*to\s*(\d{2}:\d{2})/i);
    if (uniformTimeMatch && daysFound.length > 0) {
      const startTime = uniformTimeMatch[1];
      const endTime = uniformTimeMatch[2];
      daysFound.forEach(d => { dayTimes.push({ day: d, startTime, endTime }); });
    } else {
      const perDaySectionMatch = daysAndTimesPart.match(/Specific times:\s*(.*)/i);
      if (perDaySectionMatch && perDaySectionMatch[1]) {
          const timesString = perDaySectionMatch[1];
          const timeEntries = timesString.split(';');
          timeEntries.forEach(timeEntry => {
              const dayTimeMatch = timeEntry.match(/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b:\s*(\d{2}:\d{2})\s*to\s*(\d{2}:\d{2})/i);
              if (dayTimeMatch) {
                  dayTimes.push({ day: dayTimeMatch[1] as DayOfWeek, startTime: dayTimeMatch[2], endTime: dayTimeMatch[3] });
              }
          });
      }
    }
    if (name && dayTimes.length > 0) { parsed.push({ name, dayTimes }); }
  });
  return parsed;
};

const parseUserDesiredActivities = (desiredActivitiesString: string): ParsedActivity[] => {
  const parsed: ParsedActivity[] = [];
   if (!desiredActivitiesString || desiredActivitiesString.toLowerCase().includes("no desired activities specified.")) {
    return parsed;
  }

  const activityEntries = desiredActivitiesString.split('\n');
  activityEntries.forEach(entry => {
    if (!entry.trim()) return;
    const match = entry.match(
      /^(.*?):\s*([\d.]+)\s*hours\s*(daily|weekly),\s*Min\/Max Session:\s*([\d.]+)h\/([\d.]+)h,\s*Preferred time:\s*(any|morning|afternoon|evening)/i
    );
    if (match) {
      parsed.push({
        name: match[1].trim(),
        durationHours: parseFloat(match[2]),
        frequency: match[3].toLowerCase() as 'daily' | 'weekly',
        minDurationPerSession: parseFloat(match[4]),
        maxDurationPerSession: parseFloat(match[5]),
        preferredTime: match[6].toLowerCase() as PreferredTime,
      });
    }
  });
  return parsed;
};

const parseWakeBedTimes = (lifestyleAssessment: string): { wakeUpHour: number, bedHour: number } => {
  let wakeUpHour = 7; // Default wake-up hour
  let bedHour = 22;   // Default bed hour (meaning active until 22:00, slots up to 21:00)

  const wakeUpMatch = lifestyleAssessment.match(/wakes up around (\d{2}):\d{2}/);
  if (wakeUpMatch && wakeUpMatch[1]) {
    const parsedWake = parseInt(wakeUpMatch[1], 10);
    if (!isNaN(parsedWake) && parsedWake >= 0 && parsedWake <= 23) {
      wakeUpHour = parsedWake;
    }
  }

  const bedMatch = lifestyleAssessment.match(/goes to bed around (\d{2}):\d{2}/);
  if (bedMatch && bedMatch[1]) {
    const parsedBed = parseInt(bedMatch[1], 10);
    if (!isNaN(parsedBed) && parsedBed >= 0 && parsedBed <= 23) { 
      bedHour = parsedBed;
    }
  }
  return { wakeUpHour, bedHour };
};


const getPreferredTimeSlots = (preferredTime: PreferredTime, allTimeSlots: string[], wakeUpHour: number, bedHourForDayEnd: number): string[] => {
    const currentHour = (slot: string) => parseInt(slot.substring(0, 2));
    let preferred: string[];

    const morningStart = Math.max(wakeUpHour, 7);
    const morningEnd = 12;
    const afternoonStart = 12;
    const afternoonEnd = 17;
    const eveningStart = 17;
    const eveningEnd = Math.min(bedHourForDayEnd, 22); 


    switch (preferredTime) {
        case 'morning':
            preferred = allTimeSlots.filter(slot => currentHour(slot) >= morningStart && currentHour(slot) < morningEnd);
            break;
        case 'afternoon':
            preferred = allTimeSlots.filter(slot => currentHour(slot) >= afternoonStart && currentHour(slot) < afternoonEnd);
            break;
        case 'evening':
            preferred = allTimeSlots.filter(slot => currentHour(slot) >= eveningStart && currentHour(slot) < eveningEnd);
            break;
        case 'any':
        default:
            preferred = [...allTimeSlots]; 
            break;
    }
    if (preferred.length > 0) {
        for (let i = preferred.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [preferred[i], preferred[j]] = [preferred[j], preferred[i]];
        }
    }
    return preferred;
}

const areSlotsGenerallyFree = (
    day: DayOfWeek,
    startSlotIndex: number,
    numSlotsNeeded: number,
    timeSlots: string[],
    parsedCommitments: ParsedCommitment[],
    timetableData: Record<DayOfWeek, Record<string, string[]>>,
    currentActivityName?: string,
    currentActivityMaxSession?: number
): boolean => {
    if (startSlotIndex < 0 || startSlotIndex + numSlotsNeeded > timeSlots.length) {
        return false;
    }

    if (currentActivityName && currentActivityMaxSession && startSlotIndex > 0) {
        let precedingDurationOfSameActivity = 0;
        // Check immediate preceding slot for continuation of the *same* activity.
        // This logic is to prevent breaking maxDurationPerSession by adding a new session
        // right after a previous one of the same activity.
        for (let k = startSlotIndex - 1; k >= 0; k--) {
            const prevSlotContent = timetableData[day][timeSlots[k]];
            if (prevSlotContent && prevSlotContent.some(entry => entry.includes(currentActivityName) && (entry.includes("(Sugg.)") || entry.includes("cont.")))) {
                 precedingDurationOfSameActivity += 1; // Each slot is 1 hour
            } else {
                break; // Different activity or empty slot, stop counting
            }
        }

        if (precedingDurationOfSameActivity > 0) {
            const currentSessionHours = numSlotsNeeded; 
            // If combined (preceding + current candidate) exceeds max session, this slot is not free for this session.
            if ((precedingDurationOfSameActivity + currentSessionHours) > (currentActivityMaxSession + 0.01) ) { // 0.01 for float tolerance
                return false; 
            }
        }
    }


    for (let i = 0; i < numSlotsNeeded; i++) {
        const currentSlotIndexToCheck = startSlotIndex + i;
        const slot = timeSlots[currentSlotIndexToCheck];
        
        const slotHour = parseInt(slot.substring(0,2));
        const nextHour = slotHour + 1;
        const nextSlotBoundary = `${nextHour < 10 ? '0' : ''}${nextHour}:00`;


        for (const commitment of parsedCommitments) {
            for (const ct of commitment.dayTimes) {
                if (ct.day === day && ct.startTime < nextSlotBoundary && ct.endTime > slot) {
                    return false; 
                }
            }
        }

        const existingContentInSlot = timetableData[day][slot];
        if (existingContentInSlot && existingContentInSlot.length > 0) {
            const isOccupiedByOther = existingContentInSlot.some(entry => {
                const isThisActivityContinuation = currentActivityName ? entry.includes(currentActivityName) && entry.includes("cont.") : false;
                const isThisActivityNewSessionStart = currentActivityName ? entry.includes(currentActivityName) && entry.includes("(Sugg.)") : false;
                return !(isThisActivityContinuation || isThisActivityNewSessionStart); // True if occupied by something that's NOT this activity
            });
             if (isOccupiedByOther) return false;
        }
    }
    return true;
};


const generateBasicTimetableHTML = (input: ScheduleInput): string => {
  const daysOfWeek: DayOfWeek[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  const { wakeUpHour, bedHour: rawBedHour } = parseWakeBedTimes(input.lifestyleAssessment);
  const timeSlots: string[] = [];

  let endHourForTableLoop = rawBedHour;
  if (rawBedHour === 0 || (rawBedHour <= wakeUpHour && rawBedHour !== wakeUpHour) ) {
      endHourForTableLoop = 24; 
  }
  
  if (wakeUpHour < endHourForTableLoop) {
      for (let i = wakeUpHour; i < endHourForTableLoop; i++) {
          const hourString = i < 10 ? `0${i}` : `${i}`;
          timeSlots.push(`${hourString}:00`);
      }
  }

  if (timeSlots.length === 0) {
      // Diagnostic Fallback: If dynamic slots fail, use a very distinct range.
      // If user sees 08:00-20:00, it means primary slot logic failed.
      for (let i = 8; i < 21; i++) { // Slots 08:00 to 20:00 (table ends at 21:00)
          const hourString = i < 10 ? `0${i}` : `${i}`;
          timeSlots.push(`${hourString}:00`);
      }
  }


  let html = '<table class="w-full border-collapse border border-border text-xs">';
  html += '<thead><tr class="bg-muted">';
  html += '<th class="border border-border p-1 md:p-2 text-left">Time</th>';
  daysOfWeek.forEach(day => { html += `<th class="border border-border p-1 md:p-2 text-left">${day}</th>`; });
  html += '</tr></thead>';
  html += '<tbody>';

  const parsedCommitments = parseUserCommitments(input.commitments);
  let parsedActivities = parseUserDesiredActivities(input.desiredActivities);
  let shuffledActivities = [...parsedActivities].sort(() => Math.random() - 0.5);


  const timetableData: Record<DayOfWeek, Record<string, string[]>> = {} as any;
  daysOfWeek.forEach(day => {
    timetableData[day] = {};
    timeSlots.forEach(slot => {
        timetableData[day][slot] = [];
    });
  });

  parsedCommitments.forEach(commitment => {
    commitment.dayTimes.forEach(ct => {
        timeSlots.forEach((slot) => {
            const slotHour = parseInt(slot.substring(0,2));
            const nextHour = slotHour + 1;
            const slotEndTime = nextHour === 24 ? "24:00" : `${nextHour < 10 ? '0' : ''}${nextHour}:00`;

            if (ct.day === ct.day && ct.startTime < slotEndTime && ct.endTime > slot) {
                 if(!timetableData[ct.day][slot].some(c => c.includes(commitment.name))) {
                    timetableData[ct.day][slot].push(`<div class="my-0.5 p-1 bg-primary/20 rounded text-primary text-[0.7rem] leading-tight">${commitment.name}</div>`);
                 }
            }
        });
    });
  });
  
  const shuffledDaysOfWeekForWeekly = [...daysOfWeek].sort(() => Math.random() - 0.5);

  for (const activity of shuffledActivities) {
    let preferredSlotsForActivity = [...getPreferredTimeSlots(activity.preferredTime, timeSlots, wakeUpHour, endHourForTableLoop)].sort(() => Math.random() - 0.5);

    if (activity.frequency === 'daily') {
        const dailyDurationHours = Math.max(activity.minDurationPerSession, Math.min(parseFloat(activity.durationHours.toString()), activity.maxDurationPerSession));
        const numSlotsNeeded = Math.ceil(dailyDurationHours); 
        if (numSlotsNeeded <= 0) continue;

        const shuffledDaysForDaily = [...daysOfWeek].sort(() => Math.random() - 0.5);

        for (const day of shuffledDaysForDaily) {
            let placedOnDay = false;
            let attemptSlots = [...preferredSlotsForActivity].sort(() => Math.random() - 0.5);

            for (const startSlot of attemptSlots) {
                const startSlotIndex = timeSlots.indexOf(startSlot);
                if (startSlotIndex === -1) continue;

                if (areSlotsGenerallyFree(day, startSlotIndex, numSlotsNeeded, timeSlots, parsedCommitments, timetableData, activity.name, activity.maxDurationPerSession)) {
                    for (let i = 0; i < numSlotsNeeded; i++) {
                         const currentSlot = timeSlots[startSlotIndex + i];
                         const activityText = i === 0
                            ? `<div class="my-0.5 p-1 bg-accent/20 rounded text-accent text-[0.7rem] leading-tight">${activity.name} (Sugg.)</div>`
                            : `<div class="my-0.5 p-1 bg-accent/20 rounded text-accent text-[0.7rem] leading-tight opacity-70">(${activity.name} cont.)</div>`;
                         timetableData[day][currentSlot].push(activityText);
                    }
                    placedOnDay = true;
                    break; 
                }
            }
        }
    } else if (activity.frequency === 'weekly') {
        let remainingWeeklyHours = activity.durationHours;
        let sessionCounter = 1;
        const maxSessionsAttempt = Math.ceil(activity.durationHours / activity.minDurationPerSession) + 7; // Increased buffer slightly

        while(remainingWeeklyHours > 0.01 && sessionCounter <= maxSessionsAttempt) {
            let currentSessionDurationHours = 0;
            if (remainingWeeklyHours >= activity.minDurationPerSession) {
                currentSessionDurationHours = Math.min(activity.maxDurationPerSession, remainingWeeklyHours);
                currentSessionDurationHours = Math.max(currentSessionDurationHours, activity.minDurationPerSession);
            } else { 
                 if (remainingWeeklyHours > 0.4) currentSessionDurationHours = Math.max(0.5, remainingWeeklyHours); 
                 else break; 
            }
            
            currentSessionDurationHours = Math.round(currentSessionDurationHours * 2) / 2; 
            if (currentSessionDurationHours < 0.5 && remainingWeeklyHours >=0.5) currentSessionDurationHours = 0.5;
            else if (currentSessionDurationHours < 0.5) break;

            const numSlotsNeeded = Math.ceil(currentSessionDurationHours);
            if (numSlotsNeeded <= 0) break;
            
            let sessionPlacedThisIteration = false;
            const attemptOrderDays = [...shuffledDaysOfWeekForWeekly].sort(() => Math.random() - 0.5);
            
            for (const day of attemptOrderDays) {
                let currentDayAttemptSlots = [...preferredSlotsForActivity].sort(() => Math.random() - 0.5);
                for (const startSlot of currentDayAttemptSlots) { 
                    const startSlotIndex = timeSlots.indexOf(startSlot);
                    if (startSlotIndex === -1 ) continue;

                    if (!areSlotsGenerallyFree(day, startSlotIndex, numSlotsNeeded, timeSlots, parsedCommitments, timetableData, activity.name, activity.maxDurationPerSession)) {
                        continue;
                    }
                    
                    for (let i = 0; i < numSlotsNeeded; i++) {
                         const currentSlot = timeSlots[startSlotIndex + i];
                         const activityText = i === 0
                            ? `<div class="my-0.5 p-1 bg-accent/20 rounded text-accent text-[0.7rem] leading-tight">${activity.name} - S${sessionCounter} (Sugg.)</div>`
                            : `<div class="my-0.5 p-1 bg-accent/20 rounded text-accent text-[0.7rem] leading-tight opacity-70">(${activity.name} cont.)</div>`;
                         timetableData[day][currentSlot].push(activityText);
                    }
                    remainingWeeklyHours -= currentSessionDurationHours;
                    remainingWeeklyHours = Math.max(0, remainingWeeklyHours); 
                    sessionPlacedThisIteration = true;
                    sessionCounter++;
                    break; 
                }
                if (sessionPlacedThisIteration) break; 
            }
            if (!sessionPlacedThisIteration) {
                 // If couldn't place, broaden search for next attempt or break
                if (preferredSlotsForActivity.length === timeSlots.length) break; // Already trying all slots
                preferredSlotsForActivity = [...timeSlots].sort(() => Math.random() - 0.5); // Broaden search for next session
            }
        }
    }
  }


  timeSlots.forEach((slot, slotIndex) => {
    let slotLabel = slot;
    const currentHourInt = parseInt(slot.substring(0,2));
    let nextHourInt = currentHourInt + 1;

    if (slotIndex < timeSlots.length - 1) {
        slotLabel = `${slot} - ${timeSlots[slotIndex+1]}`;
    } else { 
        const nextHourFormatted = nextHourInt === 24 ? "00" : (nextHourInt < 10 ? `0${nextHourInt}` : `${nextHourInt}`);
        slotLabel = `${slot} - ${nextHourFormatted}:00`;
    }

    html += '<tr>';
    html += `<td class="border border-border p-1 md:p-2 font-medium bg-muted/40 h-32 align-top">${slotLabel}</td>`;

    daysOfWeek.forEach(day => {
      const cellContent = timetableData[day][slot] ? timetableData[day][slot].join('') : '';
      const uniqueCellId = `cell-${day}-${slot.replace(":", "")}`; 
      html += `<td id="${uniqueCellId}" class="border border-border p-1 align-top h-32 min-w-[100px]">${cellContent || ''}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table>';
  return html;
};


export async function generateScheduleAction(input: ScheduleInput): Promise<ScheduleOutput> {
  const timetableHtml = generateBasicTimetableHTML(input);
  
  const lifestyleSummary = `Parsed wake-up: ${parseWakeBedTimes(input.lifestyleAssessment).wakeUpHour}:00, Parsed bedtime: ${parseWakeBedTimes(input.lifestyleAssessment).bedHour}:00. Other details: ${input.lifestyleAssessment}`;


  const suggestions = `
Generic Suggestions for Integration:
- Review the "(Sugg.)" placements for your desired activities. Weekly activity sessions are labeled S1, S2, etc.
- Commitments are fixed. Desired activities are suggested for open slots based on your preferences and session durations.
- On regeneration, the placement of desired activities may change to offer variety.
- Ensure you still have time for rest and unexpected events. This schedule is a starting point.
  `.trim();

  return {
    summaryLifestyle: lifestyleSummary, // Updated for clarity
    summaryCommitments: input.commitments,
    summaryDesiredActivities: input.desiredActivities,
    timetableHtml,
    suggestions
  };
}

export async function adjustScheduleAction(input: ScheduleAdjustmentsInput): Promise<ScheduleAdjustmentsOutput> {
  const suggestedAdjustments = `
Further Generic Suggestions based on your HTML schedule:
- If your goal is "${input.userGoals}", look for blocks of free time in the generated HTML timetable.
- Manually consider moving suggested activities (or their sessions) to other empty slots if the initial placement isn't ideal.
- Remember that the "(Sugg.)" activities are flexible starting points.
  `.trim();

  const rationale = `
Rationale for these generic tips:
- The HTML timetable provides a visual layout of your commitments and suggested activity sessions.
- Iterative manual adjustment is often needed to perfect a schedule.
- Flexibility helps in adapting to real-life unpredictabilities.
  `.trim();

  return { suggestedAdjustments, rationale };
}

    