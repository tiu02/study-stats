import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

// --------------- Helpers ---------------

function userCollection(uid, name) {
  return collection(db, 'users', uid, name)
}

function userDoc(uid, collectionName, docId) {
  return doc(db, 'users', uid, collectionName, docId)
}

// --------------- Sessions ---------------

export async function addSession(uid, { subject, duration, notes, date, color, status }) {
  return addDoc(userCollection(uid, 'sessions'), {
    subject,
    duration,
    notes: notes || '',
    date,
    color: color || '#6366F1',
    status: status || 'complete',
    createdAt: serverTimestamp(),
  })
}

export async function getSessions(uid) {
  const q = query(userCollection(uid, 'sessions'), orderBy('date', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

const SESSION_FIELDS = ['subject', 'duration', 'notes', 'date', 'color', 'status']

export async function updateSession(uid, sessionId, updates) {
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([k]) => SESSION_FIELDS.includes(k))
  )
  return updateDoc(userDoc(uid, 'sessions', sessionId), filtered)
}

export async function deleteSession(uid, sessionId) {
  return deleteDoc(userDoc(uid, 'sessions', sessionId))
}

// --------------- Assignments ---------------

export async function addAssignment(uid, { title, subject, dueDate }) {
  return addDoc(userCollection(uid, 'assignments'), {
    title,
    subject,
    dueDate,
    completed: false,
    createdAt: serverTimestamp(),
  })
}

export async function getAssignments(uid) {
  const q = query(userCollection(uid, 'assignments'), orderBy('dueDate', 'asc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function updateAssignment(uid, assignmentId, updates) {
  return updateDoc(userDoc(uid, 'assignments', assignmentId), updates)
}

export async function deleteAssignment(uid, assignmentId) {
  return deleteDoc(userDoc(uid, 'assignments', assignmentId))
}

// --------------- Pomodoro ---------------

export async function logPomodoroSession(uid, { workMinutes, breakMinutes }) {
  return addDoc(userCollection(uid, 'pomodoro'), {
    workMinutes,
    breakMinutes,
    completedAt: serverTimestamp(),
  })
}

export async function getPomodoroLogs(uid) {
  const q = query(userCollection(uid, 'pomodoro'), orderBy('completedAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}
