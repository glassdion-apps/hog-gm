type DraftHubProps = {
  draftSessions: {
    id: string
    name: string
    updatedAt: string
    currentPickIndex: number
  }[]
  activeDraftId: string | null
  onOpenDraft: (id: string) => void
  onNewDraft: () => void
}

export default function DraftHub({
  draftSessions,
  activeDraftId,
  onOpenDraft,
  onNewDraft,
}: DraftHubProps) {
  return (
    <div className="draft-hub">
      <section className="draft-hub-hero">
        <p className="eyebrow light">HOG GM Draft Center</p>
        <h2>Your Draft Command Center</h2>
        <p>
          Resume a saved draft or start a new mock.
        </p>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Saved Drafts</p>
            <h3>Draft Sessions</h3>
          </div>

          <button
            className="view-button"
            onClick={onNewDraft}
          >
            + New Draft
          </button>
        </div>

        {draftSessions.length === 0 ? (
          <p className="empty-state">
            No saved drafts yet.
          </p>
        ) : (
          <div className="draft-session-list">
            {draftSessions.map((draft) => (
              <div
                className={
                  draft.id === activeDraftId
                    ? 'draft-session-row active-draft-session'
                    : 'draft-session-row'
                }
                key={draft.id}
              >
                <div>
                  <strong>{draft.name}</strong>
                  <small>
                    Pick {draft.currentPickIndex + 1}
                  </small>
                </div>

                <button
                  className="view-button"
                  onClick={() => onOpenDraft(draft.id)}
                >
                  Resume
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}