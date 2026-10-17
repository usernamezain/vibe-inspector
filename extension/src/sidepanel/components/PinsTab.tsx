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
            <span style={{ fontSize: '14px' }}>📌</span>
            <span style={{ fontWeight: 600, fontSize: '13px' }}>Page Annotations</span>
            <span className="tab-badge">{openPins.length} open</span>
          </div>
          <button
            className={`btn-action ${isMarqueeActive ? 'active' : ''}`}
            onClick={onToggleMarquee}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              background: isMarqueeActive ? '#6366f1' : '#27272a',
              color: '#ffffff',
              borderColor: isMarqueeActive ? '#818cf8' : '#3f3f46',
            }}
            title="Drag across the page to group multiple elements (up to 30)"
          >
            {isMarqueeActive ? '📐 Cancel Marquee' : '📐 Marquee Group'}
          </button>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className={`btn-action ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
            style={{ flex: 1, padding: '3px 6px', fontSize: '10px' }}
          >
            All ({annotations.length})
          </button>
          <button
            className={`btn-action ${filter === 'open' ? 'active' : ''}`}
            onClick={() => setFilter('open')}
            style={{ flex: 1, padding: '3px 6px', fontSize: '10px' }}
          >
            Open ({openPins.length})
          </button>
          <button
            className={`btn-action ${filter === 'resolved' ? 'active' : ''}`}
            onClick={() => setFilter('resolved')}
            style={{ flex: 1, padding: '3px 6px', fontSize: '10px' }}
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
            border: '1px dashed #ec4899',
            background: 'rgba(236, 72, 153, 0.05)',
            padding: '10px 12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontWeight: 600, fontSize: '12px', color: '#f472b6' }}>
              🎯 {selectedGroup.name}
            </span>
            <button
              onClick={onClearGroup}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#a1a1aa',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              Clear
            </button>
          </div>
          <div style={{ fontSize: '11px', color: '#d4d4d8', marginBottom: '6px' }}>
            {selectedGroup.elements.slice(0, 3).map((e, idx) => (
              <div key={idx} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                • <strong>{e.elementName}</strong> (<code>&lt;{e.tagName}&gt;</code>)
              </div>
            ))}
            {selectedGroup.elements.length > 3 && (
              <div style={{ color: '#a1a1aa', fontStyle: 'italic', marginTop: '2px' }}>
                ...and {selectedGroup.elements.length - 3} more elements
              </div>
            )}
          </div>
        </div>
      )}

      {/* Drop Pin Section */}
      <div className="section-card" style={{ padding: '12px' }}>
        <div className="section-title" style={{ marginBottom: '8px' }}>
          <span>📍 Drop New Pin</span>
        </div>

        {element ? (
          <form onSubmit={handleCreatePin}>
            <div style={{ fontSize: '11px', color: '#a1a1aa', marginBottom: '6px' }}>
              Target: <strong style={{ color: '#fafafa' }}>{element.elementName.primary}</strong> (<code>&lt;{element.tag}&gt;</code>)
            </div>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="e.g. Change padding to 16px and use primary button color..."
              rows={3}
              style={{
                width: '100%',
                background: '#09090b',
                border: '1px solid #27272a',
                borderRadius: '6px',
                color: '#fafafa',
                padding: '8px',
                fontSize: '12px',
                resize: 'vertical',
                marginBottom: '8px',
                fontFamily: 'inherit',
              }}
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="btn-action"
              style={{
                width: '100%',
                padding: '7px 12px',
                background: newComment.trim() ? '#6366f1' : '#27272a',
                color: '#ffffff',
                fontWeight: 600,
                opacity: newComment.trim() ? 1 : 0.6,
              }}
            >
              Drop Pin on Element
            </button>
          </form>
        ) : (
          <div style={{ fontSize: '11px', color: '#a1a1aa', textAlign: 'center', padding: '12px 0' }}>
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
                borderColor: pin.status === 'resolved' ? '#10b981' : '#3f3f46',
                borderLeftWidth: '3px',
              }}
            >
              {/* Pin Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      background: pin.status === 'resolved' ? '#10b981' : '#6366f1',
                      color: '#ffffff',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    {pin.index}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '12px' }}>{pin.elementName}</span>
                  <code style={{ fontSize: '10px', color: '#a1a1aa' }}>&lt;{pin.tagName}&gt;</code>
                </div>
                <span
                  style={{
                    fontSize: '9px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    background: pin.status === 'resolved' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                    color: pin.status === 'resolved' ? '#34d399' : '#818cf8',
                  }}
                >
                  {pin.status}
                </span>
              </div>

              {/* Source info if available */}
              {pin.sourceLocation && (
                <div style={{ fontSize: '10px', color: '#818cf8', marginBottom: '6px', fontFamily: 'monospace' }}>
                  📄 {pin.sourceLocation.file}:{pin.sourceLocation.line}
                </div>
              )}

              {/* Comment text */}
              <div style={{ fontSize: '12px', color: '#e4e4e7', lineHeight: '1.4', marginBottom: '8px' }}>
                {pin.comment}
              </div>

              {/* Resolution note if present */}
              {pin.resolutionNote && (
                <div
                  style={{
                    fontSize: '11px',
                    background: '#27272a',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    color: '#a1a1aa',
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
                      background: '#09090b',
                      border: '1px solid #3f3f46',
                      borderRadius: '4px',
                      color: '#fafafa',
                      padding: '4px 8px',
                      fontSize: '11px',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      className="btn-action"
                      onClick={() => handleConfirmResolve(pin.id)}
                      style={{ flex: 1, padding: '4px', fontSize: '10px', background: '#10b981', color: '#ffffff' }}
                    >
                      Confirm Resolve
                    </button>
                    <button
                      className="btn-action"
                      onClick={() => setResolvingId(null)}
                      style={{ padding: '4px 8px', fontSize: '10px' }}
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
                  style={{ flex: 1, padding: '4px', fontSize: '11px' }}
                  title="Flash highlight this element on the page"
                >
                  🎯 Highlight
                </button>
                {pin.status === 'open' ? (
                  <button
                    className="btn-action"
                    onClick={() => {
                      setResolvingId(pin.id);
                      setResolutionNote('');
                    }}
                    style={{ flex: 1, padding: '4px', fontSize: '11px', color: '#10b981' }}
                  >
                    ✓ Resolve
                  </button>
                ) : (
                  <button
                    className="btn-action"
                    onClick={() => onReopenAnnotation(pin.id)}
                    style={{ flex: 1, padding: '4px', fontSize: '11px', color: '#818cf8' }}
                  >
                    ↺ Reopen
                  </button>
                )}
                <button
                  className="btn-action"
                  onClick={() => onDeleteAnnotation(pin.id)}
                  style={{ padding: '4px 8px', fontSize: '11px', color: '#f43f5e' }}
                  title="Delete pin"
                >
                  🗑
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
            padding: '8px',
            background: copiedPrompt ? '#10b981' : '#18181b',
            color: '#ffffff',
            fontWeight: 600,
            borderColor: copiedPrompt ? '#10b981' : '#3f3f46',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <span>📋</span>
          <span>{copiedPrompt ? '✓ Copied Prompt to Clipboard!' : 'Copy Annotations Prompt for AI'}</span>
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
