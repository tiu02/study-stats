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
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [uid])

  useEffect(() => { reload() }, [reload])

  const add = async (data) => {
    try {
      await addSession(uid, data)
      await reload()
    } catch (err) {
      setError(err.message)
    }
  }

  const update = async (id, updates) => {
    try {
      await updateSession(uid, id, updates)
      await reload()
    } catch (err) {
      setError(err.message)
    }
  }

  const remove = async (id) => {
    try {
      await deleteSession(uid, id)
      await reload()
    } catch (err) {
      setError(err.message)
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
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [uid])

  useEffect(() => { reload() }, [reload])

  const add = async (data) => {
    try {
      await addAssignment(uid, data)
      await reload()
    } catch (err) {
      setError(err.message)
    }
  }

  const update = async (id, updates) => {
    try {
      await updateAssignment(uid, id, updates)
      await reload()
    } catch (err) {
      setError(err.message)
    }
  }

  const remove = async (id) => {
    try {
      await deleteAssignment(uid, id)
      await reload()
    } catch (err) {
      setError(err.message)
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
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [uid])

  useEffect(() => { reload() }, [reload])

  const logSession = async (data) => {
    try {
      await logPomodoroSession(uid, data)
      await reload()
    } catch (err) {
      setError(err.message)
    }
  }

  return { logs, loading, error, logSession, refresh: reload }
}
