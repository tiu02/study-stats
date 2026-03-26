import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSessions } from '../hooks/useFirestore'
import SessionForm from '../components/SessionForm'
import Modal from '../components/Modal'
import DateRangePicker from '../components/DateRangePicker'
import CustomSelect from '../components/CustomSelect'
import { formatDuration, formatDate, STATUS_LABELS } from '../utils/format'
import './Sessions.css'

const STATUS_ICONS = {
  'complete': 'check_circle',
  'in-progress': 'pending',
  'incomplete': 'cancel',
}

/* Notes with 3-line clamp and "Show more" toggle (R9) */
function NotesPreview({ text }) {
  const [expanded, setExpanded] = useState(false)
  const textRef = useRef(null)
  const [clamped, setClamped] = useState(false)

  useEffect(() => {
    const el = textRef.current
    if (el) setClamped(el.scrollHeight > el.clientHeight + 1)
  }, [text])

  return (
    <div className="session-card-notes-wrapper">
      <p
        ref={expanded ? null : textRef}
        className={`session-card-notes${expanded ? '' : ' clamped'}`}
      >
        {text}
      </p>
      {(clamped || expanded) && (
        <button
          type="button"
          className="btn-show-more"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  )
}

export default function Sessions() {
  const { currentUser } = useAuth()
  const { sessions, loading, error, add, update, remove } = useSessions(currentUser?.uid)

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSession, setEditingSession] = useState(null)
  const [deletingSession, setDeletingSession] = useState(null)
  const [formError, setFormError] = useState(null)
  const [deleteError, setDeleteError] = useState(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  /* Search state */
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  /* Sort state */
  const [sortBy, setSortBy] = useState('newest')
  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = useRef(null)

  /* Filter state */
  const [subjectFilter, setSubjectFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState(null) // Date object | null
  const [dateTo, setDateTo] = useState(null)     // Date object | null
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef(null)

  /* Close dropdowns on outside click */
  useEffect(() => {
    function handler(e) {
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false)
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  /* Debounce search input → searchTerm (300ms) */
  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const addBtnRef = useRef(null)
  const editTriggerRef = useRef(null)
  const deleteTriggerRef = useRef(null)

  const classMap = useMemo(() => {
    const map = {}
    sessions.forEach((s) => { if (s.subject && s.color && !map[s.subject]) map[s.subject] = s.color })
    return map
  }, [sessions])

  /* Unique subjects for dropdown */
  const uniqueSubjects = useMemo(() => {
    const set = new Set()
    sessions.forEach((s) => { if (s.subject) set.add(s.subject) })
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [sessions])

  /* Check if any filter is active */
  const filtersActive = subjectFilter || statusFilter || dateFrom || dateTo

  /* Active filter count for badge */
  const activeFilterCount = [subjectFilter, statusFilter, dateFrom, dateTo].filter(Boolean).length

  /* Filtered + sorted sessions */
  const filteredSessions = useMemo(() => {
    let result = sessions.filter(session => {
      if (searchTerm && !session.subject?.toLowerCase().includes(searchTerm.toLowerCase())) return false
      if (subjectFilter && session.subject !== subjectFilter) return false
      if (statusFilter && (session.status || 'complete') !== statusFilter) return false
      const sessionDate = session.date?.toDate ? session.date.toDate() : new Date(session.date)
      if (dateFrom) {
        const from = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), dateFrom.getDate())
        if (sessionDate < from) return false
      }
      if (dateTo) {
        const to = new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate(), 23, 59, 59)
        if (sessionDate > to) return false
      }
      return true
    })

    // Sort
    result = [...result]
    if (sortBy === 'newest') {
      result.sort((a, b) => {
        const da = a.date?.toDate ? a.date.toDate() : new Date(a.date)
        const db = b.date?.toDate ? b.date.toDate() : new Date(b.date)
        return db - da
      })
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => {
        const da = a.date?.toDate ? a.date.toDate() : new Date(a.date)
        const db = b.date?.toDate ? b.date.toDate() : new Date(b.date)
        return da - db
      })
    } else if (sortBy === 'subject') {
      result.sort((a, b) => (a.subject || '').localeCompare(b.subject || ''))
    }

    return result
  }, [sessions, searchTerm, subjectFilter, statusFilter, dateFrom, dateTo, sortBy])

  const anyFilterOrSearch = searchTerm || filtersActive

  function clearFilters() {
    setSubjectFilter('')
    setStatusFilter('')
    setDateFrom(null)
    setDateTo(null)
  }

  function handleDateRangeChange(start, end) {
    setDateFrom(start)
    setDateTo(end)
  }

  const closeAdd = useCallback(() => {
    setShowAddModal(false)
    setFormError(null)
    setTimeout(() => addBtnRef.current?.focus())
  }, [])

  const closeEdit = useCallback(() => {
    setEditingSession(null)
    setFormError(null)
    setTimeout(() => editTriggerRef.current?.focus())
  }, [])

  const closeDelete = useCallback(() => {
    setDeletingSession(null)
    setDeleteError(null)
    setTimeout(() => deleteTriggerRef.current?.focus())
  }, [])

  async function handleAdd(data) {
    const result = await add(data)
    if (result.ok) {
      setFormError(null)
      setShowAddModal(false)
      setTimeout(() => addBtnRef.current?.focus())
    } else {
      setFormError(result.error || 'Something went wrong. Please try again.')
    }
  }

  async function handleUpdate(data) {
    const result = await update(editingSession.id, data)
    if (result.ok) {
      setFormError(null)
      setEditingSession(null)
      setTimeout(() => editTriggerRef.current?.focus())
    } else {
      setFormError(result.error || 'Something went wrong. Please try again.')
    }
  }

  async function confirmDelete() {
    setDeleteSubmitting(true)
    const result = await remove(deletingSession.id)
    setDeleteSubmitting(false)
    if (result.ok) {
      setDeleteError(null)
      setDeletingSession(null)
    } else {
      setDeleteError(result.error || 'Could not delete session. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="loading-spinner" role="status" aria-live="polite">
        <span className="spinner" aria-hidden="true"></span>
        Loading sessions&hellip;
      </div>
    )
  }

  return (
    <div className="sessions-page">
      <div className="sessions-header">
        <h1>Sessions</h1>
        <button className="btn-add" ref={addBtnRef} onClick={() => { setFormError(null); setShowAddModal(true) }}>
          <span className="material-symbols-outlined btn-add-icon" aria-hidden="true">add</span>
          Add Session
        </button>
      </div>

      {error && <p className="sessions-error" role="alert">{error}</p>}

      {/* Toolbar: search left, sort + filter right */}
      {sessions.length > 0 && (
        <div className="sessions-toolbar">
          <div className="toolbar-search-wrap">
            <span className="material-symbols-outlined toolbar-search-icon" aria-hidden="true">search</span>
            <input
              type="text"
              className={`toolbar-search${searchInput ? ' toolbar-search-has-clear' : ''}`}
              placeholder="Search by subject"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search sessions by subject"
              list="search-subjects"
            />
            {searchInput && (
              <button
                type="button"
                className="toolbar-search-clear"
                onClick={() => { setSearchInput(''); setSearchTerm('') }}
                aria-label="Clear search"
              >
                <span className="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            )}
          </div>
          <datalist id="search-subjects">
            {uniqueSubjects.map((s) => <option key={s} value={s} />)}
          </datalist>

          <div className="toolbar-actions">
            {/* Sort button */}
            <div className="toolbar-dropdown-wrap" ref={sortRef}>
              <button
                type="button"
                className={`toolbar-icon-btn${sortBy !== 'newest' ? ' toolbar-icon-btn-active' : ''}`}
                onClick={() => { setSortOpen(!sortOpen); setFilterOpen(false) }}
                aria-label="Sort sessions"
                aria-expanded={sortOpen}
                title="Sort"
              >
                <span className="material-symbols-outlined toolbar-icon-symbol" aria-hidden="true">import_export</span>
              </button>

              {sortOpen && (
                <div className="toolbar-dropdown toolbar-dropdown-sort" role="listbox" aria-label="Sort options">
                  {[
                    { value: 'newest', label: 'Newest first' },
                    { value: 'oldest', label: 'Oldest first' },
                    { value: 'subject', label: 'Subject A\u2013Z' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      aria-selected={sortBy === opt.value}
                      className={`toolbar-dropdown-item${sortBy === opt.value ? ' toolbar-dropdown-item-active' : ''}`}
                      onClick={() => { setSortBy(opt.value); setSortOpen(false) }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filter button */}
            <div className="toolbar-dropdown-wrap" ref={filterRef}>
              <button
                type="button"
                className={`toolbar-icon-btn${filtersActive ? ' toolbar-icon-btn-active' : ''}`}
                onClick={() => { setFilterOpen(!filterOpen); setSortOpen(false) }}
                aria-label="Filter sessions"
                aria-expanded={filterOpen}
                title="Filter"
              >
                <span className="material-symbols-outlined toolbar-icon-symbol" aria-hidden="true">filter_list</span>
                {activeFilterCount > 0 && (
                  <span className="toolbar-badge" aria-label={`${activeFilterCount} active filter${activeFilterCount > 1 ? 's' : ''}`}>
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {filterOpen && (
                <div className="toolbar-dropdown toolbar-dropdown-filter" role="region" aria-label="Filter options">
                  <div className="filter-field">
                    <label className="filter-field-label" htmlFor="filter-subject">Subject</label>
                    <CustomSelect
                      id="filter-subject"
                      value={subjectFilter}
                      onChange={setSubjectFilter}
                      isActive={!!subjectFilter}
                      options={[
                        { value: '', label: 'All Subjects' },
                        ...uniqueSubjects.map((s) => ({ value: s, label: s })),
                      ]}
                    />
                  </div>

                  <div className="filter-field">
                    <label className="filter-field-label" htmlFor="filter-status">Status</label>
                    <CustomSelect
                      id="filter-status"
                      value={statusFilter}
                      onChange={setStatusFilter}
                      isActive={!!statusFilter}
                      options={[
                        { value: '', label: 'All Statuses' },
                        { value: 'complete', label: 'Complete' },
                        { value: 'in-progress', label: 'In Progress' },
                        { value: 'incomplete', label: 'Incomplete' },
                      ]}
                    />
                  </div>

                  <div className="filter-field">
                    <span className="filter-field-label">Date Range</span>
                    <div className="filter-date-row">
                      <DateRangePicker
                        startDate={dateFrom}
                        endDate={dateTo}
                        onChange={handleDateRangeChange}
                      />
                      {filtersActive && (
                        <button type="button" className="filter-clear-btn" onClick={clearFilters}>
                          <span className="material-symbols-outlined filter-clear-icon" aria-hidden="true">restart_alt</span>
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Result count */}
      {sessions.length > 0 && anyFilterOrSearch && (
        <p className="filter-result-count" aria-live="polite">
          Showing {filteredSessions.length} of {sessions.length} session{sessions.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Add modal */}
      <Modal open={showAddModal} onClose={closeAdd} ariaLabel="Add session">
        <SessionForm
          onSubmit={handleAdd}
          onCancel={closeAdd}
          classMap={classMap}
          formId="add"
          formError={formError}
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editingSession} onClose={closeEdit} ariaLabel={`Edit: ${editingSession?.subject || 'session'}`}>
        {editingSession && (
          <SessionForm
            initialData={editingSession}
            onSubmit={handleUpdate}
            onCancel={closeEdit}
            classMap={classMap}
            formId="edit"
            formError={formError}
          />
        )}
      </Modal>

      {/* Delete modal */}
      <Modal
        open={!!deletingSession}
        onClose={closeDelete}
        ariaLabel={`Delete ${deletingSession?.subject || 'session'}`}
        ariaDescribedBy="delete-modal-desc"
        role="alertdialog"
        className="modal-overlay-centered"
      >
        {deletingSession && (
          <div className="delete-modal">
            <span className="material-symbols-outlined delete-modal-icon" aria-hidden="true">delete</span>
            <h2>Delete &ldquo;{deletingSession.subject}&rdquo;?</h2>
            <p id="delete-modal-desc">This action cannot be undone.</p>
            {deleteError && <p className="delete-modal-error" role="alert">{deleteError}</p>}
            <div className="delete-modal-actions">
              <button className="btn-secondary" onClick={closeDelete} disabled={deleteSubmitting}>Cancel</button>
              <button className="btn-confirm-delete" onClick={confirmDelete} disabled={deleteSubmitting}>
                {deleteSubmitting ? 'Deleting\u2026' : 'Delete'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {sessions.length === 0 ? (
        <div className="sessions-empty">
          <p>No sessions yet</p>
          <p>Tap &ldquo;Add Session&rdquo; to log your first study session.</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="sessions-empty sessions-empty-filtered">
          <span className="material-symbols-outlined sessions-empty-icon" aria-hidden="true">filter_list_off</span>
          <p><strong>No sessions match your filters</strong></p>
          <p>Try adjusting your search or filters to find what you&rsquo;re looking for.</p>
          <button type="button" className="btn-clear-inline" onClick={() => { setSearchInput(''); setSearchTerm(''); clearFilters() }}>
            Clear all filters
          </button>
        </div>
      ) : (
        <ul className="sessions-list">
          {filteredSessions.map((session) => {
            const color = session.color || '#6366F1'
            const statusKey = session.status || 'complete'

            return (
              <li
                key={session.id}
                className="session-card"
                style={{ borderLeftColor: color }}
              >
                {/* Row 1: Status icon + subject (underlined) + actions */}
                <div className="session-card-top">
                  <div className="session-card-title-group">
                    <span
                      role="img"
                      aria-label={STATUS_LABELS[statusKey] || 'Complete'}
                      className={`material-symbols-outlined status-icon status-icon-${statusKey}`}
                    >
                      {STATUS_ICONS[statusKey] || 'check_circle'}
                    </span>
                    <h2 className="session-card-subject" style={{ borderBottomColor: color }}>{session.subject}</h2>
                  </div>
                  <div className="session-card-actions">
                    <button
                      className="btn-icon"
                      onClick={(e) => { editTriggerRef.current = e.currentTarget; setFormError(null); setEditingSession(session) }}
                      aria-label={`Edit ${session.subject}`}
                      title="Edit"
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">edit</span>
                    </button>
                    <button
                      className="btn-icon btn-icon-delete"
                      onClick={(e) => { deleteTriggerRef.current = e.currentTarget; setDeleteError(null); setDeletingSession(session) }}
                      aria-label={`Delete ${session.subject}`}
                      title="Delete"
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                    </button>
                  </div>
                </div>

                {/* Row 2: Date · duration · Pomodoro */}
                <div className="session-card-meta">
                  <span className="session-card-date">{formatDate(session.date)}</span>
                  <span className="session-card-meta-sep" aria-hidden="true">&bull;</span>
                  <span className="session-card-duration">{formatDuration(session.duration)}</span>
                  {session.assignmentId && (
                    <>
                      <span className="session-card-meta-sep" aria-hidden="true">&bull;</span>
                      <span className="session-pomodoro-badge" aria-label="Logged via Pomodoro">
                        <span className="material-symbols-outlined session-pomodoro-icon" aria-hidden="true">timer</span>
                        Pomodoro
                      </span>
                    </>
                  )}
                </div>

                {/* Row 3: Notes (clamped) */}
                {session.notes?.trim() && <NotesPreview text={session.notes} />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
