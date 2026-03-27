import { useState, useEffect, useCallback } from 'react'
import {
  getSessions,
  addSession,
  updateSession,
  deleteSession,
  getAssignments,
  addAssignment,
  updateAssignment,
  deleteAssignment,
  getPomodoroLogs,
  logPomodoroSession,
} from '../services/firestore'

// --------------- Helpers ---------------

function friendlyError(err) {
  if (import.meta.env.DEV) console.error('[Firestore]', err)
  const code = err.code || ''
  if (code === 'permission-denied') return 'You do not have permission to perform this action.'
  if (code === 'not-found') return 'The requested item was not found.'
  if (code === 'unavailable') return 'Service is temporarily unavailable. Please try again.'
  if (code === 'unauthenticated') return 'You must be logged in to perform this action.'
  if (code === 'failed-precondition') return 'A required database index is missing. Please contact support.'
  return 'Something went wrong. Please try again.'
}

// --------------- useSessions ---------------

export function useSessions(uid) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    if (!uid) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      setSessions(await getSessions(uid))
      setError(null)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }, [uid])

  useEffect(() => { reload() }, [reload])

  const add = async (data) => {
    try {
      await addSession(uid, data)
      await reload()
      return { ok: true }
    } catch (err) {
      const msg = friendlyError(err)
      setError(msg)
      return { ok: false, error: msg }
    }
  }

  const update = async (id, updates) => {
    try {
      await updateSession(uid, id, updates)
      await reload()
      return { ok: true }
    } catch (err) {
      const msg = friendlyError(err)
      setError(msg)
      return { ok: false, error: msg }
    }
  }

  const remove = async (id) => {
    try {
      await deleteSession(uid, id)
      await reload()
      return { ok: true }
    } catch (err) {
      const msg = friendlyError(err)
      setError(msg)
      return { ok: false, error: msg }
    }
  }

  return { sessions, loading, error, add, update, remove, refresh: reload }
}

// --------------- useAssignments ---------------

export function useAssignments(uid) {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    if (!uid) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      setAssignments(await getAssignments(uid))
      setError(null)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }, [uid])

  useEffect(() => { reload() }, [reload])

  const add = async (data) => {
    try {
      await addAssignment(uid, data)
      await reload()
      return { ok: true }
    } catch (err) {
      const msg = friendlyError(err)
      setError(msg)
      return { ok: false, error: msg }
    }
  }

  const update = async (id, updates) => {
    try {
      await updateAssignment(uid, id, updates)
      await reload()
      return { ok: true }
    } catch (err) {
      const msg = friendlyError(err)
      setError(msg)
      return { ok: false, error: msg }
    }
  }

  const remove = async (id) => {
    try {
      await deleteAssignment(uid, id)
      await reload()
      return { ok: true }
    } catch (err) {
      const msg = friendlyError(err)
      setError(msg)
      return { ok: false, error: msg }
    }
  }

  return { assignments, loading, error, add, update, remove, refresh: reload }
}

// --------------- usePomodoro ---------------

export function usePomodoro(uid) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    if (!uid) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      setLogs(await getPomodoroLogs(uid))
      setError(null)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }, [uid])

  useEffect(() => { reload() }, [reload])

  const logSession = async (data) => {
    try {
      await logPomodoroSession(uid, data)
      await reload()
      return { ok: true }
    } catch (err) {
      const msg = friendlyError(err)
      setError(msg)
      return { ok: false, error: msg }
    }
  }

  return { logs, loading, error, logSession, refresh: reload }
}
