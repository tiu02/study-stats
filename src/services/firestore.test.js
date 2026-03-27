import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Firestore SDK — must be before importing the module under test
const mockAddDoc = vi.fn()
const mockGetDocs = vi.fn()
const mockUpdateDoc = vi.fn()
const mockDeleteDoc = vi.fn()
const mockCollection = vi.fn()
const mockDoc = vi.fn()
const mockQuery = vi.fn()
const mockOrderBy = vi.fn()
const mockServerTimestamp = vi.fn(() => 'SERVER_TIMESTAMP')

vi.mock('firebase/firestore', () => ({
  collection: (...args) => mockCollection(...args),
  addDoc: (...args) => mockAddDoc(...args),
  getDocs: (...args) => mockGetDocs(...args),
  updateDoc: (...args) => mockUpdateDoc(...args),
  deleteDoc: (...args) => mockDeleteDoc(...args),
  doc: (...args) => mockDoc(...args),
  query: (...args) => mockQuery(...args),
  orderBy: (...args) => mockOrderBy(...args),
  serverTimestamp: () => mockServerTimestamp(),
}))

vi.mock('../firebase', () => ({
  db: 'MOCK_DB',
}))

import {
  addSession,
  getSessions,
  updateSession,
  deleteSession,
  addAssignment,
  getAssignments,
  updateAssignment,
  deleteAssignment,
  logPomodoroSession,
  getPomodoroLogs,
} from './firestore'

describe('Firestore service', () => {
  const uid = 'user-abc-123'

  beforeEach(() => {
    vi.clearAllMocks()
    mockCollection.mockReturnValue('COLLECTION_REF')
    mockDoc.mockReturnValue('DOC_REF')
    mockQuery.mockReturnValue('QUERY_REF')
    mockOrderBy.mockReturnValue('ORDER_REF')
  })

  // --------------- Path verification ---------------

  describe('subcollection paths', () => {
    it('sessions functions use users/{uid}/sessions', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] })
      await getSessions(uid)
      expect(mockCollection).toHaveBeenCalledWith('MOCK_DB', 'users', uid, 'sessions')
    })

    it('assignments functions use users/{uid}/assignments', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] })
      await getAssignments(uid)
      expect(mockCollection).toHaveBeenCalledWith('MOCK_DB', 'users', uid, 'assignments')
    })

    it('pomodoro functions use users/{uid}/pomodoro', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] })
      await getPomodoroLogs(uid)
      expect(mockCollection).toHaveBeenCalledWith('MOCK_DB', 'users', uid, 'pomodoro')
    })

    it('updateSession uses correct doc path', async () => {
      await updateSession(uid, 'session-1', { subject: 'Math' })
      expect(mockDoc).toHaveBeenCalledWith('MOCK_DB', 'users', uid, 'sessions', 'session-1')
    })

    it('deleteSession uses correct doc path', async () => {
      await deleteSession(uid, 'session-1')
      expect(mockDoc).toHaveBeenCalledWith('MOCK_DB', 'users', uid, 'sessions', 'session-1')
    })

    it('updateAssignment uses correct doc path', async () => {
      await updateAssignment(uid, 'assign-1', { completed: true })
      expect(mockDoc).toHaveBeenCalledWith('MOCK_DB', 'users', uid, 'assignments', 'assign-1')
    })

    it('deleteAssignment uses correct doc path', async () => {
      await deleteAssignment(uid, 'assign-1')
      expect(mockDoc).toHaveBeenCalledWith('MOCK_DB', 'users', uid, 'assignments', 'assign-1')
    })
  })

  // --------------- Sessions ---------------

  describe('addSession', () => {
    it('writes correct fields with serverTimestamp', async () => {
      const data = { subject: 'Math', duration: 45, notes: 'Chapter 3', date: new Date('2026-03-23'), color: '#3B82F6', status: 'in-progress' }
      await addSession(uid, data)

      expect(mockAddDoc).toHaveBeenCalledWith('COLLECTION_REF', {
        subject: 'Math',
        duration: 45,
        notes: 'Chapter 3',
        date: data.date,
        color: '#3B82F6',
        status: 'in-progress',
        assignmentId: null,
        createdAt: 'SERVER_TIMESTAMP',
      })
    })

    it('defaults notes, color, and status when not provided', async () => {
      await addSession(uid, { subject: 'Bio', duration: 30, notes: undefined, date: new Date() })

      expect(mockAddDoc).toHaveBeenCalledWith('COLLECTION_REF', expect.objectContaining({
        notes: '',
        color: '#6366F1',
        status: 'complete',
      }))
    })

    it('stores explicit assignmentId when provided', async () => {
      await addSession(uid, { subject: 'Math', duration: 25, date: new Date(), assignmentId: 'assign-99' })

      expect(mockAddDoc).toHaveBeenCalledWith('COLLECTION_REF', expect.objectContaining({
        assignmentId: 'assign-99',
      }))
    })
  })

  describe('getSessions', () => {
    it('orders by date descending', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] })
      await getSessions(uid)
      expect(mockOrderBy).toHaveBeenCalledWith('date', 'desc')
    })

    it('maps docs to objects with id', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [
          { id: 's1', data: () => ({ subject: 'Math', duration: 30 }) },
          { id: 's2', data: () => ({ subject: 'Bio', duration: 60 }) },
        ],
      })

      const result = await getSessions(uid)
      expect(result).toEqual([
        { id: 's1', subject: 'Math', duration: 30 },
        { id: 's2', subject: 'Bio', duration: 60 },
      ])
    })

    it('returns empty array when no documents exist', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] })
      const result = await getSessions(uid)
      expect(result).toEqual([])
    })
  })

  describe('updateSession', () => {
    it('calls updateDoc with the correct ref and updates', async () => {
      await updateSession(uid, 'session-1', { subject: 'Physics' })
      expect(mockUpdateDoc).toHaveBeenCalledWith('DOC_REF', { subject: 'Physics' })
    })

    it('strips fields not in SESSION_FIELDS whitelist', async () => {
      await updateSession(uid, 'session-1', { subject: 'Math', createdAt: 'now', id: 'abc', unknown: true })
      expect(mockUpdateDoc).toHaveBeenCalledWith('DOC_REF', { subject: 'Math' })
    })

    it('passes all whitelisted SESSION_FIELDS through', async () => {
      const updates = { subject: 'Bio', duration: 60, notes: 'ch4', date: new Date(), color: '#3B82F6', status: 'in-progress', assignmentId: 'a1' }
      await updateSession(uid, 'session-1', updates)
      expect(mockUpdateDoc).toHaveBeenCalledWith('DOC_REF', updates)
    })
  })

  describe('deleteSession', () => {
    it('calls deleteDoc with the correct ref', async () => {
      await deleteSession(uid, 'session-1')
      expect(mockDeleteDoc).toHaveBeenCalledWith('DOC_REF')
    })
  })

  // --------------- Assignments ---------------

  describe('addAssignment', () => {
    it('writes correct fields with completed defaulting to false', async () => {
      const dueDate = new Date('2026-04-01')
      await addAssignment(uid, { title: 'Essay', subject: 'English', dueDate })

      expect(mockAddDoc).toHaveBeenCalledWith('COLLECTION_REF', {
        title: 'Essay',
        subject: 'English',
        dueDate,
        completed: false,
        color: '#6366F1',
        totalMinutesLogged: 0,
        notes: '',
        createdAt: 'SERVER_TIMESTAMP',
      })
    })

    it('stores explicit color when provided', async () => {
      const dueDate = new Date('2026-05-01')
      await addAssignment(uid, { title: 'Lab Report', subject: 'Chem', dueDate, color: '#8B5CF6' })

      expect(mockAddDoc).toHaveBeenCalledWith('COLLECTION_REF', expect.objectContaining({
        color: '#8B5CF6',
      }))
    })
  })

  describe('getAssignments', () => {
    it('orders by dueDate ascending', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] })
      await getAssignments(uid)
      expect(mockOrderBy).toHaveBeenCalledWith('dueDate', 'asc')
    })

    it('maps docs to objects with id', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [
          { id: 'a1', data: () => ({ title: 'Essay', completed: false }) },
        ],
      })

      const result = await getAssignments(uid)
      expect(result).toEqual([{ id: 'a1', title: 'Essay', completed: false }])
    })

    it('returns empty array when no documents exist', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] })
      const result = await getAssignments(uid)
      expect(result).toEqual([])
    })
  })

  describe('updateAssignment', () => {
    it('calls updateDoc with the correct ref and updates', async () => {
      await updateAssignment(uid, 'assign-1', { completed: true })
      expect(mockUpdateDoc).toHaveBeenCalledWith('DOC_REF', { completed: true })
    })

    it('strips fields not in ASSIGNMENT_FIELDS whitelist', async () => {
      await updateAssignment(uid, 'assign-1', { completed: true, createdAt: 'now', id: 'abc', unknown: true })
      expect(mockUpdateDoc).toHaveBeenCalledWith('DOC_REF', { completed: true })
    })

    it('passes all whitelisted ASSIGNMENT_FIELDS through', async () => {
      const updates = { title: 'Essay', subject: 'English', dueDate: new Date(), completed: false, color: '#8B5CF6', totalMinutesLogged: 50, notes: 'Some notes' }
      await updateAssignment(uid, 'assign-1', updates)
      expect(mockUpdateDoc).toHaveBeenCalledWith('DOC_REF', updates)
    })
  })

  describe('deleteAssignment', () => {
    it('calls deleteDoc with the correct ref', async () => {
      await deleteAssignment(uid, 'assign-1')
      expect(mockDeleteDoc).toHaveBeenCalledWith('DOC_REF')
    })
  })

  // --------------- Pomodoro ---------------

  describe('logPomodoroSession', () => {
    it('writes correct fields with serverTimestamp', async () => {
      await logPomodoroSession(uid, { workMinutes: 25, breakMinutes: 5 })

      expect(mockAddDoc).toHaveBeenCalledWith('COLLECTION_REF', {
        workMinutes: 25,
        breakMinutes: 5,
        completedAt: 'SERVER_TIMESTAMP',
      })
    })
  })

  describe('getPomodoroLogs', () => {
    it('orders by completedAt descending', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] })
      await getPomodoroLogs(uid)
      expect(mockOrderBy).toHaveBeenCalledWith('completedAt', 'desc')
    })

    it('maps docs to objects with id', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [
          { id: 'p1', data: () => ({ workMinutes: 25, breakMinutes: 5 }) },
        ],
      })

      const result = await getPomodoroLogs(uid)
      expect(result).toEqual([{ id: 'p1', workMinutes: 25, breakMinutes: 5 }])
    })

    it('returns empty array when no documents exist', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] })
      const result = await getPomodoroLogs(uid)
      expect(result).toEqual([])
    })
  })
})
