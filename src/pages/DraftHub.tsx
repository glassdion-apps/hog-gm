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
    onDeleteDraft: (id: string) => void
    onRenameDraft: (id: string) => void
}

export default function DraftHub({
    draftSessions,
    activeDraftId,
    onOpenDraft,
    onNewDraft,
    onDeleteDraft,
    onRenameDraft,
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

                                    <small>
                                        Updated {new Date(draft.updatedAt).toLocaleString()}
                                    </small>
                                </div>

                                <div className="draft-session-actions">
                                    <button
                                        className="view-button"
                                        onClick={() => onOpenDraft(draft.id)}
                                    >
                                        Resume
                                    </button>
                                    <button
                                        className="view-button"
                                        onClick={() => onRenameDraft(draft.id)}
                                    >
                                        Rename
                                    </button>
                                    <button
                                        className="delete-draft-button"
                                        onClick={() => onDeleteDraft(draft.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}