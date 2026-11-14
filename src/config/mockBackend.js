// In-memory mock backend for the public Pivot demo (GitHub Pages).
// No server, no real data — all mutable state lives in a persisted "world"
// (see demoWorld.js): one world per browser, shared by every demo persona.
// Shapes mirror pivot-backend's public API responses.

import { ATHLETES } from '../data/mockData'
import { getInitialWorld, saveWorld, resetDemoWorld } from './demoWorld'

export { resetDemoWorld }

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

// Six demo athlete accounts matching the coach roster 1:1 (names must match
// ATHLETES so mockAthleteForUser resolves each persona's own dashboard data).
export const DEMO_ATHLETES = ATHLETES.map(a => ({
  id: a.id,
  email: `${a.name.toLowerCase().replace(/[^a-z]+/g, '.')}@pivot.demo`,
  name: a.name,
  role: 'athlete',
  sport: 'rowing',
  school: a.school,
  teamName: a.team,
  position: a.position,
  height: a.height,
  weight: a.weight,
  status: a.status,
  alertLevel: a.alertLevel || null,
  recovering: !!a.recovering,
}))

const STATUS_COLORS = {
  good: '#10b981',
  warning: '#f59e0b',
  danger: '#f43f5e',
  urgent: '#a855f7',
}

export function athleteStatusColor(a) {
  return STATUS_COLORS[a?.status] || '#10b981'
}

let currentUser = null

export function setCurrentUser(user) {
  currentUser = user || null
}

export function getCurrentUser() {
  return currentUser
}

const athleteById = (id) => ATHLETES.find(a => a.id === id)

// ── World state (persisted) ──────────────────────────────────────────────
const world = getInitialWorld()

const ok = (data) => Promise.resolve({ success: true, ...data })
const delay = (ms = 120) => new Promise(r => setTimeout(r, ms))

// ── Substitution handlers ────────────────────────────────────────────────
export async function mockListSubstitutionRequests() {
  await delay()
  const me = currentUser
  if (!me) return ok({ requests: [] })
  if (me.role === 'coach') return ok({ requests: [...world.substitutionRequests] })
  return ok({
    requests: world.substitutionRequests.filter(r => r.requesterId === me.id || r.substituteId === me.id),
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
    id: world.nextRequestId++,
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
  world.substitutionRequests = [req, ...world.substitutionRequests]
  saveWorld(world)
  return ok({ request: req })
}

function updateRequest(id, patch) {
  const req = world.substitutionRequests.find(r => r.id === Number(id))
  if (!req) return null
  Object.assign(req, patch, { updatedAt: new Date().toISOString() })
  saveWorld(world)
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
    id: world.nextRequestId++,
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
  world.substitutionRequests = [req, ...world.substitutionRequests]
  saveWorld(world)
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
  const rows = world.messages.filter(m =>
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
    id: world.nextMessageId++,
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
  world.messages = [...world.messages, msg]
  saveWorld(world)
  return ok({ message: msg })
}

export async function mockMarkMessageRead(id) {
  await delay()
  const target = world.messages.find(m => m.id === Number(id))
  if (target && !target.readAt) {
    target.readAt = new Date().toISOString()
    saveWorld(world)
  }
  return ok({})
}
