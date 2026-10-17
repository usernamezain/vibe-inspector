import { ElementInfo, PageInfo } from './types.js';

/**
 * Standard WebSocket RPC Request/Response frame
 */
export interface BridgeMessage<T = any> {
  id: string;
  type: string;
  payload?: T;
  error?: string;
  timestamp: number;
}

export type BridgeRequestType =
  | 'GET_SELECTION'
  | 'CLEAR_SELECTION'
  | 'HIGHLIGHT_ELEMENT'
  | 'GET_PAGE_INFO'
  | 'CAPTURE_SCREENSHOT'
  | 'APPLY_STYLE'
  | 'GET_ANNOTATIONS'
  | 'RESOLVE_ANNOTATION'
  | 'GET_COMPUTED_STYLES'
  | 'PING';

export type BridgeNotificationType =
  | 'SELECTION_CHANGED'
  | 'PAGE_NAVIGATED'
  | 'MUTATION_APPROVAL_REQUEST';
