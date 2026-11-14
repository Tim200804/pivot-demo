// Demo "world" persistence for the public Pivot demo (GitHub Pages).
//
// One browser = one independent demo world. All six athlete personas and the
// coach inside a browser SHARE this world (required to demo the multi-party
// substitution flow); different browsers/devices are isolated by localStorage.
//
// Only user-mutable data lives here: substitutionRequests + messages (+ id
// counters). Static mock data (health/training/checkins from mockData.js) is
// never mutated and therefore not persisted.

const WORLD_KEY = 'pivot_demo_world_v2'
const WORLD_VERSION = 2

const daysFromNow = (n, hour = 9) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

const dateFromNow = (n) => daysFromNow(n).slice(0, 10)

// ── Seed factory ─────────────────────────────────────────────────────────
// Five substitution requests covering every branch of the state machine, and
// every persona has something to do at first login (see DEMO_ACCOUNTS_SPEC).
function buildSeed() {
  const coach = { id: 'coach-1', name: 'Sarah Mitchell' }

  const substitutionRequests = [
    {
      // R1 — teammate (Morgan) must accept, then coach approves
      id: 1,
      requesterId: 'ath-001', requesterName: 'Alex Chen', requesterPosition: 'Stroke Seat',
      substituteId: 'ath-003', substituteName: 'Morgan Smith',
      coachId: coach.id, coachName: coach.name,
      position: 'Stroke Seat',
      trainingDate: dateFromNow(2),
      reason: 'Family commitment out of town',
      needsSubstitute: true, initiatedBy: 'athlete',
      status: 'pending_teammate',
      responseNote: '', coachNote: '',
      createdAt: daysFromNow(-1), updatedAt: daysFromNow(-1),
    },
    {
      // R2 — teammate (Taylor) must accept, then coach approves
      id: 2,
      requesterId: 'ath-003', requesterName: 'Morgan Smith', requesterPosition: '3 Seat',
      substituteId: 'ath-006', substituteName: 'Taylor Brooks',
      coachId: coach.id, coachName: coach.name,
      position: '3 Seat',
      trainingDate: dateFromNow(3),
      reason: 'Orthodontist appointment after class',
      needsSubstitute: true, initiatedBy: 'athlete',
      status: 'pending_teammate',
      responseNote: '', coachNote: '',
      createdAt: daysFromNow(0, 8), updatedAt: daysFromNow(0, 8),
    },
    {
      // R3 — mid-state: teammate already accepted, coach approval pending
      id: 3,
      requesterId: 'ath-002', requesterName: 'Jordan Lee', requesterPosition: 'Bow Seat',
      substituteId: 'ath-005', substituteName: 'Riley Kim',
      coachId: coach.id, coachName: coach.name,
      position: 'Bow Seat',
      trainingDate: dateFromNow(4),
      reason: 'Physio appointment for recurring back tightness',
      needsSubstitute: true, initiatedBy: 'athlete',
      status: 'teammate_accepted',
      responseNote: 'Got you covered — take care of the back.', coachNote: '',
      createdAt: daysFromNow(-2), updatedAt: daysFromNow(-1, 12),
    },
    {
      // R4 — coach-initiated: requester (Casey) must confirm, then coach approves
      id: 4,
      requesterId: 'ath-004', requesterName: 'Casey Park', requesterPosition: 'Coxswain',
      substituteId: 'ath-001', substituteName: 'Alex Chen',
      coachId: coach.id, coachName: coach.name,
      position: 'Coxswain',
      trainingDate: dateFromNow(5),
      reason: 'Recovery week — coach arranged coverage',
      needsSubstitute: true, initiatedBy: 'coach',
      status: 'pending_requester',
      responseNote: '', coachNote: '',
      createdAt: daysFromNow(0, 7), updatedAt: daysFromNow(0, 7),
    },
    {
      // R5 — completed history example
      id: 5,
      requesterId: 'ath-005', requesterName: 'Riley Kim', requesterPosition: '2 Seat',
      substituteId: 'ath-002', substituteName: 'Jordan Lee',
      coachId: coach.id, coachName: coach.name,
      position: '2 Seat',
      trainingDate: dateFromNow(-2),
      reason: 'Dental surgery follow-up',
      needsSubstitute: true, initiatedBy: 'athlete',
      status: 'coach_approved',
      responseNote: 'No problem, feel better soon!', coachNote: 'Approved — Jordan is cleared for the extra volume.',
      createdAt: daysFromNow(-4), updatedAt: daysFromNow(-2, 18),
    },
  ]

  const messages = [
    {
      id: 1,
      senderId: 'coach-1', senderName: 'Sarah Mitchell', recipientId: 'ath-003',
      subject: 'How are you doing?',
      body: 'Hi Morgan, I noticed your HRV has been trending down for three days and your check-ins show higher fatigue. How are you feeling?',
      alertLevel: null, alertType: null,
      readAt: daysFromNow(-1, 20), createdAt: daysFromNow(-1, 19),
    },
    {
      id: 2,
      senderId: 'ath-003', senderName: 'Morgan Smith', recipientId: 'coach-1',
      subject: null,
      body: 'Honestly pretty wiped — midterms plus morning practices. Sleeping maybe 4-5 hours. I\'m going to bed earlier this week.',
      alertLevel: null, alertType: null,
      readAt: daysFromNow(-1, 22), createdAt: daysFromNow(-1, 21),
    },
    {
      id: 3,
      senderId: 'coach-1', senderName: 'Sarah Mitchell', recipientId: 'ath-003',
      subject: null,
      body: 'Thanks for telling me. Let\'s cut Tuesday\'s volume in half and skip the erg test — check in with me Friday morning.',
      alertLevel: null, alertType: null,
      readAt: null, createdAt: daysFromNow(0, 8),
    },
    {
      // Unread nudge to Casey — motivates the R4 confirmation step
      id: 4,
      senderId: 'coach-1', senderName: 'Sarah Mitchell', recipientId: 'ath-004',
      subject: 'Your recovery week',
      body: 'Casey — your metrics have been flashing red all week. Thursday\'s session is covered: Alex will take your seat. Please confirm the substitution request, and let\'s talk about adjusting this week\'s load.',
      alertLevel: null, alertType: null,
      readAt: null, createdAt: daysFromNow(0, 8),
    },
  ]

  return {
    version: WORLD_VERSION,
    seededAt: new Date().toISOString(),
    nextRequestId: 6,
    nextMessageId: 5,
    substitutionRequests,
    messages,
  }
}

// ── Persistence API ──────────────────────────────────────────────────────
function isValidWorld(w) {
  return w
    && w.version === WORLD_VERSION
    && Array.isArray(w.substitutionRequests)
    && Array.isArray(w.messages)
    && Number.isFinite(w.nextRequestId)
    && Number.isFinite(w.nextMessageId)
}

export function loadWorld() {
  try {
    const raw = localStorage.getItem(WORLD_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return isValidWorld(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveWorld(world) {
  try {
    localStorage.setItem(WORLD_KEY, JSON.stringify(world))
  } catch {
    // storage full or blocked — demo keeps working in-memory for this session
  }
}

/** World for this session: existing one, or a fresh seed persisted for next time. */
export function getInitialWorld() {
  const existing = loadWorld()
  if (existing) return existing
  const seed = buildSeed()
  saveWorld(seed)
  return seed
}

/** Reset: drop everything and return to the initial flow state. */
export function resetDemoWorld() {
  try {
    localStorage.removeItem(WORLD_KEY)
  } catch { /* noop */ }
  const seed = buildSeed()
  saveWorld(seed)
  return seed
}
