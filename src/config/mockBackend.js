// In-memory mock backend for the public Pivot demo (GitHub Pages).
// No server, no real data — everything lives in this module's memory and
// resets on page reload. Shapes mirror pivot-backend's public API responses.

import { ATHLETES } from '../data/mockData'

export const DEMO_COACH = {
  id: 'coach-1',
  email: 's.mitchell@pivot.demo',
  name: 'Sarah Mitchell',
  role: 'coach',
  sport: 'rowing',
  school: 'University of Pennsylvania',
  teamName: 'Varsity Heavyweight 8+',
  coachRole: 'Head Coach',
}

export const DEMO_ATHLETE = {
  id: 'ath-003',
  email: 'm.smith@pivot.demo',
  name: 'Morgan Smith',
  role: 'athlete',
  sport: 'rowing',
  school: 'University of Pennsylvania',
  teamName: 'Varsity Heavyweight 8+',
  position: '3 Seat',
  height: 196,
  weight: 89,
}

let currentUser = null

export function setCurrentUser(user) {
  currentUser = user || null
}

export function getCurrentUser() {
  return currentUser
}

const daysFromNow = (n, hour = 9) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

const dateFromNow = (n) => daysFromNow(n).slice(0, 10)

const athleteById = (id) => ATHLETES.find(a => a.id === id)

// ── Substitution requests ────────────────────────────────────────────────
let nextRequestId = 5

let substitutionRequests = [
  {
    id: 1,
    requesterId: 'ath-003',
    requesterName: 'Morgan Smith',
    requesterPosition: '3 Seat',
    substituteId: 'ath-006',
    substituteName: 'Taylor Brooks',
    coachId: 'coach-1',
    coachName: 'Sarah Mitchell',
    position: '3 Seat',
    trainingDate: dateFromNow(2),
    reason: 'Orthodontist appointment after class',
    needsSubstitute: true,
    initiatedBy: 'athlete',
    status: 'pending_teammate',
    responseNote: '',
    coachNote: '',
    createdAt: daysFromNow(-1),
    updatedAt: daysFromNow(-1),
  },
  {
    id: 2,
    requesterId: 'ath-001',
    requesterName: 'Alex Chen',
    requesterPosition: 'Stroke Seat',
    substituteId: 'ath-003',
    substituteName: 'Morgan Smith',
    coachId: 'coach-1',
    coachName: 'Sarah Mitchell',
    position: 'Stroke Seat',
    trainingDate: dateFromNow(3),
    reason: 'Family commitment out of town',
    needsSubstitute: true,
    initiatedBy: 'athlete',
    status: 'pending_teammate',
    responseNote: '',
    coachNote: '',
    createdAt: daysFromNow(0, 8),
    updatedAt: daysFromNow(0, 8),
  },
  {
    id: 3,
    requesterId: 'ath-003',
    requesterName: 'Morgan Smith',
    requesterPosition: '3 Seat',
    substituteId: 'ath-002',
    substituteName: 'Jordan Lee',
    coachId: 'coach-1',
    coachName: 'Sarah Mitchell',
    position: '3 Seat',
    trainingDate: dateFromNow(5),
    reason: 'Midterm exam block — needs study day',
    needsSubstitute: true,
    initiatedBy: 'athlete',
    status: 'coach_approved',
    responseNote: 'Happy to cover, good luck with exams!',
    coachNote: 'Approved — Jordan has been cleared for extra volume.',
    createdAt: daysFromNow(-3),
    updatedAt: daysFromNow(-1, 18),
  },
  {
    id: 4,
    requesterId: 'ath-003',
    requesterName: 'Morgan Smith',
    requesterPosition: '3 Seat',
    substituteId: 'ath-006',
    substituteName: 'Taylor Brooks',
    coachId: 'coach-1',
    coachName: 'Sarah Mitchell',
    position: '3 Seat',
    trainingDate: dateFromNow(4),
    reason: 'Light recovery week — coach arranged',
    needsSubstitute: true,
    initiatedBy: 'coach',
    status: 'pending_coach',
    responseNote: '',
    coachNote: '',
    createdAt: daysFromNow(0, 7),
    updatedAt: daysFromNow(0, 7),
  },
]

// ── Messages ─────────────────────────────────────────────────────────────
let nextMessageId = 4

let messages = [
  {
    id: 1,
    senderId: 'coach-1',
    senderName: 'Sarah Mitchell',
    recipientId: 'ath-003',
    subject: 'How are you doing?',
    body: 'Hi Morgan, I noticed your HRV has been trending down for three days and your check-ins show higher fatigue. How are you feeling?',
    alertLevel: null,
    alertType: null,
    readAt: daysFromNow(-1, 20),
    createdAt: daysFromNow(-1, 19),
  },
  {
    id: 2,
    senderId: 'ath-003',
    senderName: 'Morgan Smith',
    recipientId: 'coach-1',
    subject: null,
    body: 'Honestly pretty wiped — midterms plus morning practices. Sleeping maybe 4-5 hours. I\'m going to bed earlier this week.',
    alertLevel: null,
    alertType: null,
    readAt: daysFromNow(-1, 22),
    createdAt: daysFromNow(-1, 21),
  },
  {
    id: 3,
    senderId: 'coach-1',
    senderName: 'Sarah Mitchell',
    recipientId: 'ath-003',
    subject: null,
    body: 'Thanks for telling me. Let\'s cut Tuesday\'s volume in half and skip the erg test — check in with me Friday morning.',
    alertLevel: null,
    alertType: null,
    readAt: null,
    createdAt: daysFromNow(0, 8),
  },
]

const ok = (data) => Promise.resolve({ success: true, ...data })
const delay = (ms = 120) => new Promise(r => setTimeout(r, ms))

// ── Substitution handlers ────────────────────────────────────────────────
export async function mockListSubstitutionRequests() {
  await delay()
  const me = currentUser
  if (!me) return ok({ requests: [] })
  if (me.role === 'coach') return ok({ requests: [...substitutionRequests] })
  return ok({
    requests: substitutionRequests.filter(r => r.requesterId === me.id || r.substituteId === me.id),
  })
}

export async function mockListSubstitutionCandidates() {
  await delay()
  const me = currentUser
  const teammates = ATHLETES.filter(a => a.id !== me?.id)
  return ok({
    candidates: teammates.map(a => ({
      id: a.id, name: a.name, role: 'athlete', position: a.position,
      school: a.school, teamName: a.team, sport: 'rowing',
    })),
  })
}

export async function mockListCoachSubstitutionCandidates() {
  await delay()
  return mockListSubstitutionCandidates()
}

export async function mockCreateSubstitutionRequest({ trainingDate, reason, substituteId, needsSubstitute = true }) {
  await delay()
  const me = currentUser
  const sub = athleteById(substituteId)
  const req = {
    id: nextRequestId++,
    requesterId: me.id,
    requesterName: me.name,
    requesterPosition: me.position || '',
    substituteId: sub?.id ?? substituteId,
    substituteName: sub?.name ?? null,
    coachId: DEMO_COACH.id,
    coachName: DEMO_COACH.name,
    position: me.position || '',
    trainingDate,
    reason: reason || '',
    needsSubstitute,
    initiatedBy: 'athlete',
    status: needsSubstitute ? 'pending_teammate' : 'pending_coach',
    responseNote: '',
    coachNote: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  substitutionRequests = [req, ...substitutionRequests]
  return ok({ request: req })
}

function updateRequest(id, patch) {
  const req = substitutionRequests.find(r => r.id === Number(id))
  if (!req) return null
  Object.assign(req, patch, { updatedAt: new Date().toISOString() })
  return req
}

export async function mockRespondSubstitutionRequest(id, accept, note = '') {
  await delay()
  const req = updateRequest(id, {
    status: accept ? 'teammate_accepted' : 'teammate_rejected',
    responseNote: note,
  })
  return ok({ request: req })
}

export async function mockRequesterRespondSubstitutionRequest(id, accept, note = '') {
  await delay()
  const req = updateRequest(id, {
    status: accept ? 'requester_approved' : 'pending_teammate',
    responseNote: note,
  })
  return ok({ request: req })
}

export async function mockCoachApproveSubstitutionRequest(id, approve, note = '') {
  await delay()
  const req = updateRequest(id, {
    status: approve ? 'coach_approved' : 'coach_rejected',
    coachNote: note || '',
  })
  return ok({ request: req })
}

export async function mockCoachInitiateSubstitution({ athleteId, substituteId, trainingDate, reason, needsSubstitute = true }) {
  await delay()
  const athlete = athleteById(athleteId)
  const sub = athleteById(substituteId)
  const req = {
    id: nextRequestId++,
    requesterId: athlete?.id ?? athleteId,
    requesterName: athlete?.name ?? 'Athlete',
    requesterPosition: athlete?.position ?? '',
    substituteId: sub?.id ?? substituteId ?? null,
    substituteName: sub?.name ?? null,
    coachId: currentUser?.id ?? DEMO_COACH.id,
    coachName: currentUser?.name ?? DEMO_COACH.name,
    position: athlete?.position ?? '',
    trainingDate,
    reason: reason || '',
    needsSubstitute,
    initiatedBy: 'coach',
    status: needsSubstitute ? 'pending_requester' : 'pending_coach',
    responseNote: '',
    coachNote: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  substitutionRequests = [req, ...substitutionRequests]
  return ok({ request: req })
}

export async function mockCoachSendSubstitutionMessage() {
  await delay()
  return ok({ message: 'Demo: substitution message logged' })
}

// ── Roster ───────────────────────────────────────────────────────────────
export async function mockListAthletes() {
  await delay()
  return ok({
    athletes: ATHLETES.map(a => ({
      id: a.id, name: a.name, role: 'athlete', sport: 'rowing',
      school: a.school, teamName: a.team, position: a.position,
      height: a.height, weight: a.weight,
      status: a.status, currentHRV: a.currentHRV,
    })),
  })
}

// ── Messages ─────────────────────────────────────────────────────────────
export async function mockGetConversation(otherUserId) {
  await delay()
  const me = currentUser
  const rows = messages.filter(m =>
    (m.senderId === me?.id && m.recipientId === otherUserId)
    || (m.senderId === otherUserId && m.recipientId === me?.id))
  return ok({
    messages: rows.map(m => ({ ...m, isSender: m.senderId === me?.id })),
  })
}

export async function mockSendMessage({ recipientId, body, subject = null }) {
  await delay()
  const me = currentUser
  const msg = {
    id: nextMessageId++,
    senderId: me?.id,
    senderName: me?.name,
    recipientId,
    subject,
    body,
    alertLevel: null,
    alertType: null,
    readAt: null,
    createdAt: new Date().toISOString(),
  }
  messages = [...messages, msg]
  return ok({ message: msg })
}

export async function mockMarkMessageRead(id) {
  await delay()
  messages = messages.map(m => m.id === Number(id) && !m.readAt
    ? { ...m, readAt: new Date().toISOString() }
    : m)
  return ok({})
}
