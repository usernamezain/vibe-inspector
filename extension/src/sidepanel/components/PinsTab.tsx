import { useState } from 'react';
import {
  ElementInfo,
  AnnotationItem,
  AnnotationGroup,
  formatAnnotationsPrompt,
} from '@vibe-inspector/shared';

interface PinsTabProps {
  element: ElementInfo | null;
  annotations: AnnotationItem[];
  selectedGroup: AnnotationGroup | null;
  pageUrl: string;
  isMarqueeActive: boolean;
  onToggleMarquee: () => void;
  onAddAnnotation: (comment: string) => void;
  onResolveAnnotation: (id: string, note?: string) => void;
  onReopenAnnotation: (id: string) => void;
  onDeleteAnnotation: (id: string) => void;
  onClearAll: () => void;
  onClearGroup: () => void;
  onHighlight: (selector?: string, label?: string) => void;
}

export function PinsTab({
  element,
  annotations,
  selectedGroup,
  pageUrl,
  isMarqueeActive,
  onToggleMarquee,
  onAddAnnotation,
  onResolveAnnotation,
  onReopenAnnotation,
  onDeleteAnnotation,
  onClearAll,
  onClearGroup,
  onHighlight,
}: PinsTabProps) {
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [newComment, setNewComment] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  const openPins = annotations.filter((a) => a.status === 'open');
  const resolvedPins = annotations.filter((a) => a.status === 'resolved');

  const filteredPins = annotations.filter((a) => {
    if (filter === 'open') return a.status === 'open';
    if (filter === 'resolved') return a.status === 'resolved';
    return true;
  });

  const handleCreatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onAddAnnotation(newComment.trim());
    setNewComment('');
  };

  const handleCopyPrompt = () => {
    const prompt = formatAnnotationsPrompt(annotations, pageUrl, selectedGroup || undefined);
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    });
  };

  const handleConfirmResolve = (id: string) => {
    onResolveAnnotation(id, resolutionNote.trim() || undefined);
    setResolvingId(null);
    setResolutionNote('');
  };

  return (
    <div className="tab-pane">
      {/* Top Action Bar */}
      <div className="section-card" style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span style={{ fontWeight: 600, fontSize: '12px', color: '#09090b' }}>Page Annotations</span>
            <span className="tab-badge">{openPins.length} open</span>
          </div>
          <button
            className={`btn-action ${isMarqueeActive ? 'active' : ''}`}
            onClick={onToggleMarquee}
            style={{
              padding: '6px 10px',
              fontSize: '11px',
              fontWeight: 500,
              background: isMarqueeActive ? '#000000' : '#ffffff',
              color: isMarqueeActive ? '#ffffff' : '#09090b',
              border: '1px solid #000000',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
            title="Drag across the page to group multiple elements (up to 30)"
          >
            {isMarqueeActive ? 'Cancel Marquee' : 'Marquee Group'}
          </button>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className="btn-action"
            onClick={() => setFilter('all')}
            style={{
              flex: 1,
              padding: '6px 8px',
              minHeight: '26px',
              fontSize: '10px',
              fontWeight: 500,
              background: filter === 'all' ? '#000000' : '#ffffff',
              color: filter === 'all' ? '#ffffff' : '#09090b',
              border: '1px solid ' + (filter === 'all' ? '#000000' : '#e4e4e7'),
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            All ({annotations.length})
          </button>
          <button
            className="btn-action"
            onClick={() => setFilter('open')}
            style={{
              flex: 1,
              padding: '6px 8px',
              minHeight: '26px',
              fontSize: '10px',
              fontWeight: 500,
              background: filter === 'open' ? '#000000' : '#ffffff',
              color: filter === 'open' ? '#ffffff' : '#09090b',
              border: '1px solid ' + (filter === 'open' ? '#000000' : '#e4e4e7'),
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Open ({openPins.length})
          </button>
          <button
            className="btn-action"
            onClick={() => setFilter('resolved')}
            style={{
              flex: 1,
              padding: '6px 8px',
              minHeight: '26px',
              fontSize: '10px',
              fontWeight: 500,
              background: filter === 'resolved' ? '#000000' : '#ffffff',
              color: filter === 'resolved' ? '#ffffff' : '#09090b',
              border: '1px solid ' + (filter === 'resolved' ? '#000000' : '#e4e4e7'),
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Resolved ({resolvedPins.length})
          </button>
        </div>
      </div>

      {/* Selected Marquee Group Cluster */}
      {selectedGroup && (
        <div
          className="section-card"
          style={{
            border: '1px dashed #000000',
            background: '#fafafa',
            padding: '10px 12px',
            borderRadius: '4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontWeight: 600, fontSize: '12px', color: '#09090b', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="22" y1="12" x2="18" y2="12"/>
                <line x1="6" y1="12" x2="2" y2="12"/>
                <line x1="12" y1="6" x2="12" y2="2"/>
                <line x1="12" y1="22" x2="12" y2="18"/>
              </svg>
              <span>{selectedGroup.name}</span>
            </span>
            <button
              onClick={onClearGroup}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#71717a',
                cursor: 'pointer',
                fontSize: '11px',
                padding: '2px 6px',
              }}
            >
              Clear
            </button>
          </div>
          <div style={{ fontSize: '11px', color: '#52525b', marginBottom: '6px' }}>
            {selectedGroup.elements.slice(0, 3).map((e, idx) => (
              <div key={idx} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                • <strong>{e.elementName}</strong> (<code>&lt;{e.tagName}&gt;</code>)
              </div>
            ))}
            {selectedGroup.elements.length > 3 && (
              <div style={{ color: '#71717a', fontStyle: 'italic', marginTop: '2px' }}>
                ...and {selectedGroup.elements.length - 3} more elements
              </div>
            )}
          </div>
        </div>
      )}

      {/* Drop Pin Section */}
      <div className="section-card" style={{ padding: '12px' }}>
        <div className="section-title" style={{ marginBottom: '8px' }}>
          <span style={{ fontWeight: 600, fontSize: '12px', color: '#09090b', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span>Drop New Pin</span>
          </span>
        </div>

        {element ? (
          <form onSubmit={handleCreatePin}>
            <div style={{ fontSize: '11px', color: '#71717a', marginBottom: '6px' }}>
              Target: <strong style={{ color: '#09090b' }}>{element.elementName.primary}</strong> (<code>&lt;{element.tag}&gt;</code>)
            </div>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="e.g. Change padding to 16px and make background pure white..."
              rows={3}
              style={{
                width: '100%',
                background: '#ffffff',
                border: '1px solid #d4d4d8',
                borderRadius: '4px',
                color: '#09090b',
                padding: '8px',
                fontSize: '12px',
                resize: 'vertical',
                marginBottom: '8px',
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="btn-action"
              style={{
                width: '100%',
                padding: '7px 12px',
                background: newComment.trim() ? '#000000' : '#e4e4e7',
                color: newComment.trim() ? '#ffffff' : '#71717a',
                border: '1px solid ' + (newComment.trim() ? '#000000' : '#d4d4d8'),
                borderRadius: '4px',
                fontWeight: 600,
                cursor: newComment.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Drop Pin on Element
            </button>
          </form>
        ) : (
          <div style={{ fontSize: '11px', color: '#71717a', textAlign: 'center', padding: '12px 0' }}>
            Inspect an element with the picker above to drop a pin on it.
          </div>
        )}
      </div>

      {/* Annotations List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredPins.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 12px', color: '#71717a', fontSize: '12px' }}>
            No annotations found for current filter.
          </div>
        ) : (
          filteredPins.map((pin) => (
            <div
              key={pin.id}
              className="section-card"
              style={{
                padding: '10px 12px',
                borderColor: '#e4e4e7',
                borderLeft: '3px solid ' + (pin.status === 'resolved' ? '#166534' : '#000000'),
                borderRadius: '4px',
              }}
            >
              {/* Pin Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      background: '#000000',
                      color: '#ffffff',
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    {pin.index}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '12px', color: '#09090b' }}>{pin.elementName}</span>
                  <code style={{ fontSize: '10px', color: '#71717a' }}>&lt;{pin.tagName}&gt;</code>
                </div>
                <span
                  style={{
                    fontSize: '9px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    background: pin.status === 'resolved' ? '#f0fdf4' : '#f4f4f5',
                    color: pin.status === 'resolved' ? '#166534' : '#000000',
                    border: '1px solid ' + (pin.status === 'resolved' ? '#bbf7d0' : '#e4e4e7'),
                  }}
                >
                  {pin.status}
                </span>
              </div>

              {/* Source info if available */}
              {pin.sourceLocation && (
                <div style={{ fontSize: '10px', color: '#52525b', marginBottom: '6px', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <span>{pin.sourceLocation.file}:{pin.sourceLocation.line}</span>
                </div>
              )}

              {/* Comment text */}
              <div style={{ fontSize: '12px', color: '#09090b', lineHeight: '1.4', marginBottom: '8px' }}>
                {pin.comment}
              </div>

              {/* Resolution note if present */}
              {pin.resolutionNote && (
                <div
                  style={{
                    fontSize: '11px',
                    background: '#f4f4f5',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    color: '#52525b',
                    fontStyle: 'italic',
                    marginBottom: '8px',
                  }}
                >
                  Note: {pin.resolutionNote}
                </div>
              )}

              {/* Resolve Dialog Input */}
              {resolvingId === pin.id && (
                <div style={{ marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <input
                    type="text"
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="Optional resolution note / commit..."
                    style={{
                      background: '#ffffff',
                      border: '1px solid #d4d4d8',
                      borderRadius: '4px',
                      color: '#09090b',
                      padding: '4px 8px',
                      fontSize: '11px',
                      outline: 'none',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      className="btn-action"
                      onClick={() => handleConfirmResolve(pin.id)}
                      style={{
                        flex: 1,
                        padding: '4px',
                        fontSize: '10px',
                        background: '#000000',
                        color: '#ffffff',
                        border: '1px solid #000000',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Confirm Resolve
                    </button>
                    <button
                      className="btn-action"
                      onClick={() => setResolvingId(null)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '10px',
                        background: '#ffffff',
                        border: '1px solid #d4d4d8',
                        color: '#09090b',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Pin Actions */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className="btn-action"
                  onClick={() => onHighlight(pin.selector, `Pin #${pin.index}`)}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    minHeight: '28px',
                    fontSize: '11px',
                    fontWeight: 500,
                    background: '#ffffff',
                    border: '1px solid #d4d4d8',
                    color: '#09090b',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                  }}
                  title="Flash highlight this element on the page"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="22" y1="12" x2="18" y2="12"/>
                    <line x1="6" y1="12" x2="2" y2="12"/>
                    <line x1="12" y1="6" x2="12" y2="2"/>
                    <line x1="12" y1="22" x2="12" y2="18"/>
                  </svg>
                  <span>Highlight</span>
                </button>
                {pin.status === 'open' ? (
                  <button
                    className="btn-action"
                    onClick={() => {
                      setResolvingId(pin.id);
                      setResolutionNote('');
                    }}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      minHeight: '28px',
                      fontSize: '11px',
                      fontWeight: 500,
                      color: '#09090b',
                      background: '#f4f4f5',
                      border: '1px solid #d4d4d8',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>Resolve</span>
                  </button>
                ) : (
                  <button
                    className="btn-action"
                    onClick={() => onReopenAnnotation(pin.id)}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      minHeight: '28px',
                      fontSize: '11px',
                      fontWeight: 500,
                      color: '#09090b',
                      background: '#f4f4f5',
                      border: '1px solid #d4d4d8',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="1 4 1 10 7 10"/>
                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                    </svg>
                    <span>Reopen</span>
                  </button>
                )}
                <button
                  className="btn-action"
                  onClick={() => onDeleteAnnotation(pin.id)}
                  style={{
                    padding: '6px 10px',
                    minHeight: '28px',
                    fontSize: '11px',
                    color: '#09090b',
                    background: '#ffffff',
                    border: '1px solid #d4d4d8',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Delete pin"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Export & Prompt Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
        <button
          className="btn-action"
          onClick={handleCopyPrompt}
          style={{
            width: '100%',
            padding: '9px 14px',
            minHeight: '36px',
            background: copiedPrompt ? '#f4f4f5' : '#000000',
            color: copiedPrompt ? '#09090b' : '#ffffff',
            fontWeight: 600,
            fontSize: '12px',
            border: '1px solid #000000',
            borderRadius: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          <span>{copiedPrompt ? 'Copied Prompt to Clipboard!' : 'Copy Annotations Prompt for AI'}</span>
        </button>

        {annotations.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete all pins on this page?')) {
                onClearAll();
              }
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#71717a',
              cursor: 'pointer',
              fontSize: '11px',
              padding: '4px',
              textAlign: 'center',
            }}
          >
            Clear all pins on this page
          </button>
        )}
      </div>
    </div>
  );
}
