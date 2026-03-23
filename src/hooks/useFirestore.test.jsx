import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

// Mock the service layer
const mockGetSessions = vi.fn()
const mockAddSession = vi.fn()
const mockUpdateSession = vi.fn()
const mockDeleteSession = vi.fn()
const mockGetAssignments = vi.fn()
const mockAddAssignment = vi.fn()
const mockUpdateAssignment = vi.fn()
const mockDeleteAssignment = vi.fn()
const mockGetPomodoroLogs = vi.fn()
const mockLogPomodoroSession = vi.fn()

vi.mock('../services/firestore', () => ({
  getSessions: (...args) => mockGetSessions(...args),
  addSession: (...args) => mockAddSession(...args),
  updateSession: (...args) => mockUpdateSession(...args),
  deleteSession: (...args) => mockDeleteSession(...args),
  getAssignments: (...args) => mockGetAssignments(...args),
  addAssignment: (...args) => mockAddAssignment(...args),
  updateAssignment: (...args) => mockUpdateAssignment(...args),
  deleteAssignment: (...args) => mockDeleteAssignment(...args),
  getPomodoroLogs: (...args) => mockGetPomodoroLogs(...args),
  logPomodoroSession: (...args) => mockLogPomodoroSession(...args),
}))

import { useSessions, useAssignments, usePomodoro } from './useFirestore'

const uid = 'user-abc-123'

describe('useSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns correct shape', async () => {
    mockGetSessions.mockResolvedValue([])
    const { result } = renderHook(() => useSessions(uid))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current).toEqual(expect.objectContaining({
      sessions: expect.any(Array),
      loading: false,
      error: null,
      add: expect.any(Function),
      update: expect.any(Function),
      remove: expect.any(Function),
      refresh: expect.any(Function),
    }))
  })

  it('fetches sessions on mount with correct uid', async () => {
    mockGetSessions.mockResolvedValue([{ id: 's1', subject: 'Math' }])
    const { result } = renderHook(() => useSessions(uid))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(mockGetSessions).toHaveBeenCalledWith(uid)
    expect(result.current.sessions).toEqual([{ id: 's1', subject: 'Math' }])
  })

  it('sets loading to false and returns empty array when uid is null', async () => {
    const { result } = renderHook(() => useSessions(null))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(mockGetSessions).not.toHaveBeenCalled()
    expect(result.current.sessions).toEqual([])
  })

  it('sets loading to false and returns empty array when uid is undefined', async () => {
    const { result } = renderHook(() => useSessions(undefined))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(mockGetSessions).not.toHaveBeenCalled()
    expect(result.current.sessions).toEqual([])
  })

  it('handles empty results from Firestore', async () => {
    mockGetSessions.mockResolvedValue([])
    const { result } = renderHook(() => useSessions(uid))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.sessions).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('sets error when fetch fails', async () => {
    mockGetSessions.mockRejectedValue(new Error('Permission denied'))
    const { result } = renderHook(() => useSessions(uid))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('Permission denied')
    expect(result.current.sessions).toEqual([])
  })

  it('add calls addSession and refetches', async () => {
    mockGetSessions.mockResolvedValue([])
    mockAddSession.mockResolvedValue()
    const { result } = renderHook(() => useSessions(uid))

    await waitFor(() => expect(result.current.loading).toBe(false))

    mockGetSessions.mockResolvedValue([{ id: 's1', subject: 'Bio' }])
    await act(() => result.current.add({ subject: 'Bio', duration: 30, date: new Date() }))

    expect(mockAddSession).toHaveBeenCalledWith(uid, expect.objectContaining({ subject: 'Bio' }))
    expect(result.current.sessions).toEqual([{ id: 's1', subject: 'Bio' }])
  })

  it('update calls updateSession and refetches', async () => {
    mockGetSessions.mockResolvedValue([{ id: 's1', subject: 'Math' }])
    mockUpdateSession.mockResolvedValue()
    const { result } = renderHook(() => useSessions(uid))

    await waitFor(() => expect(result.current.loading).toBe(false))

    mockGetSessions.mockResolvedValue([{ id: 's1', subject: 'Physics' }])
    await act(() => result.current.update('s1', { subject: 'Physics' }))

    expect(mockUpdateSession).toHaveBeenCalledWith(uid, 's1', { subject: 'Physics' })
    expect(result.current.sessions).toEqual([{ id: 's1', subject: 'Physics' }])
  })

  it('remove calls deleteSession and refetches', async () => {
    mockGetSessions.mockResolvedValue([{ id: 's1', subject: 'Math' }])
    mockDeleteSession.mockResolvedValue()
    const { result } = renderHook(() => useSessions(uid))

    await waitFor(() => expect(result.current.loading).toBe(false))

    mockGetSessions.mockResolvedValue([])
    await act(() => result.current.remove('s1'))

    expect(mockDeleteSession).toHaveBeenCalledWith(uid, 's1')
    expect(result.current.sessions).toEqual([])
  })

  it('sets error when a mutation fails', async () => {
    mockGetSessions.mockResolvedValue([])
    mockAddSession.mockRejectedValue(new Error('Network error'))
    const { result } = renderHook(() => useSessions(uid))

    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(() => result.current.add({ subject: 'Math', duration: 30, date: new Date() }))

    expect(result.current.error).toBe('Network error')
  })

  it('refetches when uid changes', async () => {
    mockGetSessions.mockResolvedValue([{ id: 's1', subject: 'Math' }])
    const { result, rerender } = renderHook(({ id }) => useSessions(id), {
      initialProps: { id: 'user-1' },
    })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(mockGetSessions).toHaveBeenCalledWith('user-1')

    mockGetSessions.mockResolvedValue([{ id: 's2', subject: 'Bio' }])
    rerender({ id: 'user-2' })

    await waitFor(() => expect(result.current.sessions).toEqual([{ id: 's2', subject: 'Bio' }]))
    expect(mockGetSessions).toHaveBeenCalledWith('user-2')
  })
})

describe('useAssignments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns correct shape', async () => {
    mockGetAssignments.mockResolvedValue([])
    const { result } = renderHook(() => useAssignments(uid))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current).toEqual(expect.objectContaining({
      assignments: expect.any(Array),
      loading: false,
      error: null,
      add: expect.any(Function),
      update: expect.any(Function),
      remove: expect.any(Function),
      refresh: expect.any(Function),
    }))
  })

  it('fetches assignments on mount with correct uid', async () => {
    mockGetAssignments.mockResolvedValue([{ id: 'a1', title: 'Essay' }])
    const { result } = renderHook(() => useAssignments(uid))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(mockGetAssignments).toHaveBeenCalledWith(uid)
    expect(result.current.assignments).toEqual([{ id: 'a1', title: 'Essay' }])
  })

  it('sets loading to false when uid is null', async () => {
    const { result } = renderHook(() => useAssignments(null))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(mockGetAssignments).not.toHaveBeenCalled()
    expect(result.current.assignments).toEqual([])
  })

  it('handles empty results', async () => {
    mockGetAssignments.mockResolvedValue([])
    const { result } = renderHook(() => useAssignments(uid))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.assignments).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('sets error when fetch fails', async () => {
    mockGetAssignments.mockRejectedValue(new Error('Firestore unavailable'))
    const { result } = renderHook(() => useAssignments(uid))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('Firestore unavailable')
  })

  it('add calls addAssignment and refetches', async () => {
    mockGetAssignments.mockResolvedValue([])
    mockAddAssignment.mockResolvedValue()
    const { result } = renderHook(() => useAssignments(uid))

    await waitFor(() => expect(result.current.loading).toBe(false))

    mockGetAssignments.mockResolvedValue([{ id: 'a1', title: 'Essay' }])
    await act(() => result.current.add({ title: 'Essay', subject: 'English', dueDate: new Date() }))

    expect(mockAddAssignment).toHaveBeenCalledWith(uid, expect.objectContaining({ title: 'Essay' }))
    expect(result.current.assignments).toEqual([{ id: 'a1', title: 'Essay' }])
  })

  it('sets error when a mutation fails', async () => {
    mockGetAssignments.mockResolvedValue([])
    mockDeleteAssignment.mockRejectedValue(new Error('Not found'))
    const { result } = renderHook(() => useAssignments(uid))

    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(() => result.current.remove('nonexistent-id'))

    expect(result.current.error).toBe('Not found')
  })
})

describe('usePomodoro', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns correct shape', async () => {
    mockGetPomodoroLogs.mockResolvedValue([])
    const { result } = renderHook(() => usePomodoro(uid))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current).toEqual(expect.objectContaining({
      logs: expect.any(Array),
      loading: false,
      error: null,
      logSession: expect.any(Function),
      refresh: expect.any(Function),
    }))
  })

  it('fetches logs on mount with correct uid', async () => {
    mockGetPomodoroLogs.mockResolvedValue([{ id: 'p1', workMinutes: 25 }])
    const { result } = renderHook(() => usePomodoro(uid))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(mockGetPomodoroLogs).toHaveBeenCalledWith(uid)
    expect(result.current.logs).toEqual([{ id: 'p1', workMinutes: 25 }])
  })

  it('sets loading to false when uid is null', async () => {
    const { result } = renderHook(() => usePomodoro(null))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(mockGetPomodoroLogs).not.toHaveBeenCalled()
    expect(result.current.logs).toEqual([])
  })

  it('handles empty results', async () => {
    mockGetPomodoroLogs.mockResolvedValue([])
    const { result } = renderHook(() => usePomodoro(uid))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.logs).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('sets error when fetch fails', async () => {
    mockGetPomodoroLogs.mockRejectedValue(new Error('Timeout'))
    const { result } = renderHook(() => usePomodoro(uid))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('Timeout')
  })

  it('logSession calls logPomodoroSession and refetches', async () => {
    mockGetPomodoroLogs.mockResolvedValue([])
    mockLogPomodoroSession.mockResolvedValue()
    const { result } = renderHook(() => usePomodoro(uid))

    await waitFor(() => expect(result.current.loading).toBe(false))

    mockGetPomodoroLogs.mockResolvedValue([{ id: 'p1', workMinutes: 25, breakMinutes: 5 }])
    await act(() => result.current.logSession({ workMinutes: 25, breakMinutes: 5 }))

    expect(mockLogPomodoroSession).toHaveBeenCalledWith(uid, { workMinutes: 25, breakMinutes: 5 })
    expect(result.current.logs).toEqual([{ id: 'p1', workMinutes: 25, breakMinutes: 5 }])
  })

  it('sets error when logSession fails', async () => {
    mockGetPomodoroLogs.mockResolvedValue([])
    mockLogPomodoroSession.mockRejectedValue(new Error('Write failed'))
    const { result } = renderHook(() => usePomodoro(uid))

    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(() => result.current.logSession({ workMinutes: 25, breakMinutes: 5 }))

    expect(result.current.error).toBe('Write failed')
  })
})
