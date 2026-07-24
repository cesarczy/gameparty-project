export interface AuthResponse {
  playerId: string;
  username?: string;
  displayName: string;
  role: string;
  avatarUrl: string | null;
  token: string;
  emailVerificationRequired?: boolean;
  verificationMessage?: string;
}

export interface UserProfile {
  playerId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  hasPassword: boolean;
  canChangeDisplayName: boolean;
  nextDisplayNameChangeAt: string | null;
  canChangeEmail: boolean;
  nextEmailChangeAt: string | null;
  favoritos: string[];
  profanityFilterEnabled: boolean;
  chatOnline: boolean;
  theme: string;
  language: string;
  rank: PlayerRank;
}

export interface PlayerRank {
  id: string;
  label: string;
  badge: string;
  badgeImageUrl?: string | null;
  minDays: number;
}

export interface PublicProfile {
  playerId: string;
  displayName: string;
  avatarUrl: string | null;
  rank: PlayerRank;
  isBanned: boolean;
  isOnline: boolean;
  createdAt: string;
}

export interface AdminPanel {
  stats: {
    totalPlayers: number;
    totalAdmins: number;
    totalGames: number;
    totalCategories: number;
    onlinePlayers: number;
    activeChats: number;
    newPlayersToday: number;
    openReports: number;
  };
}

export interface AdminPlayer {
  playerId: string;
  username: string;
  email: string;
  displayName: string;
  role: string;
  avatarUrl: string | null;
  createdAt: string;
  isOnline: boolean;
  isBanned: boolean;
  isSystemAccount?: boolean;
  isPrimaryAdmin?: boolean;
  country: string | null;
  birthDate: string | null;
  language: string;
  emailVerified: boolean;
  chatOnline: boolean;
  rankId: string | null;
  rank: PlayerRank;
}

export interface AdminPlayerSearchResult {
  playerId: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  isBanned: boolean;
}

export interface AdminReport {
  reportId: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  reporter: { playerId: string; displayName: string };
  reported: { playerId: string; displayName: string };
}

export interface AdminActiveRoom {
  roomId: string;
  title: string;
  gameName: string;
  gameSlug: string;
  participantCount: number;
  participants: Array<{ playerId: string; displayName: string }>;
}

export interface AdminGame {
  gameId: string;
  name: string;
  slug: string;
  active: boolean;
}

export interface AdminGameDetail extends AdminGame {
  coverUrl: string | null;
  coverDisplayUrl: string;
  categoryIds: string[];
}

export interface ActivityLogEntry {
  logId: string;
  category: 'AUTH' | 'PROFILE' | 'ADMIN' | 'SECURITY';
  type: string;
  message: string;
  subjectId: string | null;
  actorId: string | null;
  actorName: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AdminPlayerLogs {
  playerId: string;
  displayName: string;
  isBanned: boolean;
  bannedAt: string | null;
  logs: ActivityLogEntry[];
  grouped: {
    auth: ActivityLogEntry[];
    profile: ActivityLogEntry[];
    admin: ActivityLogEntry[];
    security: ActivityLogEntry[];
  };
}

export interface AdminGlobalLogs {
  logs: ActivityLogEntry[];
  grouped: {
    auth: ActivityLogEntry[];
    profile: ActivityLogEntry[];
    admin: ActivityLogEntry[];
    security: ActivityLogEntry[];
  };
}

export interface Category {
  categoryId: string;
  name: string;
  slug: string;
  active?: boolean;
}

export interface AdminCategoryDetail {
  categoryId: string;
  name: string;
  slug: string;
  active: boolean;
  linkedGamesCount: number;
}

export interface Game {
  gameId: string;
  name: string;
  slug: string;
  supportedModes: string[];
  active: boolean;
  lobbyRoomId: string | null;
  coverUrl: string;
}

export interface LobbyInfo {
  roomId: string;
  gameId: string;
  gameName: string;
  title: string;
  participantCount: number;
}

export interface RoomInfo {
  roomId: string;
  gameId: string;
  gameName: string;
  gameSlug: string;
  coverUrl: string;
  title: string;
  participantCount: number;
}

export interface ChatMessage {
  type: 'message';
  messageId: string;
  roomId: string;
  authorId: string;
  authorDisplayName: string;
  authorRole?: string;
  authorAvatarUrl: string | null;
  content: string;
  sentAt: string;
}

export type RoomSocketEvent =
  | ChatMessage
  | { type: 'participantCount'; roomId: string; participantCount: number };

export interface FriendSummary {
  playerId: string;
  displayName: string;
  avatarUrl: string | null;
  isOnline: boolean;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  payload: unknown;
  read: boolean;
  createdAt: string;
}

export interface PrivateMessage {
  messageId: string;
  senderId: string;
  receiverId: string;
  senderDisplayName: string;
  content: string;
  sentAt: string;
}

const TOKEN_KEY = 'gameparty_token';

let onSessionInvalid: (() => void) | null = null;

export function registerSessionInvalidHandler(handler: () => void) {
  onSessionInvalid = handler;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function isWrongCurrentPasswordMessage(message: string): boolean {
  return message.toLowerCase().includes('senha atual');
}

export function isSessionInvalidError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  if (isWrongCurrentPasswordMessage(error.message)) return false;
  if (error.status === 401) return true;
  return error.status === 404 && error.message.toLowerCase().includes('sessão');
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const isFormData = init?.body instanceof FormData;
  const hasJsonBody = init?.body !== undefined && init?.body !== null && init?.body !== '';
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
  };
  if (!isFormData && hasJsonBody) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, { ...init, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = body.error ?? 'Erro na requisição';
    const sessionInvalid =
      token &&
      !isWrongCurrentPasswordMessage(message) &&
      (res.status === 401 || (res.status === 404 && path.includes('/profile/me')));
    if (sessionInvalid) {
      onSessionInvalid?.();
    }
    throw new ApiError(message, res.status);
  }
  return body as T;
}

export const api = {
  register: (payload: {
    username: string;
    email: string;
    senha: string;
    fullName: string;
    displayName: string;
    birthDate: string;
    country: string;
    language: 'pt-BR' | 'en-US' | 'es-ES';
    acceptTerms: true;
    confirmAge18: true;
  }) =>
    request<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),

  forgotPassword: (payload: { email: string }) =>
    request<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  resetPassword: (payload: { token: string; senha: string }) =>
    request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifyEmail: (token: string) =>
    request<{ verified: boolean; alreadyVerified?: boolean }>(`/api/auth/verify-email?token=${encodeURIComponent(token)}`),

  searchGames: (q: string, limit = 8) =>
    request<{ games: Game[] }>(`/api/jogos?q=${encodeURIComponent(q)}&limit=${limit}`),

  login: (payload: { email: string; senha: string }) =>
    request<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),

  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),

  googleLogin: (idToken: string) =>
    request<AuthResponse>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    }),

  getProfile: () => request<UserProfile>('/api/profile/me'),

  updateProfile: (payload: { displayName: string }) =>
    request<{ playerId: string; displayName: string; token: string }>('/api/profile/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  changeEmail: (payload: { novoEmail: string; senhaAtual?: string }) =>
    request<{ playerId: string; email: string }>('/api/profile/me/email', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  changePassword: (payload: { senhaAtual?: string; senhaNova: string }) =>
    request<{ playerId: string; updated: true }>('/api/profile/me/senha', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  updateAvatar: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<{ playerId: string; avatarUrl: string | null }>('/api/profile/me/avatar', {
      method: 'POST',
      body: form,
    });
  },

  updateSettings: (payload: {
    profanityFilterEnabled?: boolean;
    chatOnline?: boolean;
    theme?: 'dark' | 'light';
    language?: 'pt-BR' | 'en-US' | 'es-ES';
  }) =>
    request<{ profanityFilterEnabled: boolean; chatOnline: boolean; theme: string; language: string }>(
      '/api/profile/me/configuracoes',
      { method: 'PATCH', body: JSON.stringify(payload) },
    ),

  addFavorite: (gameId: string) =>
    request<{ gameId: string }>('/api/profile/favoritos', {
      method: 'POST',
      body: JSON.stringify({ gameId }),
    }),

  removeFavorite: (gameId: string) =>
    request<{ gameId: string }>(`/api/profile/favoritos/${gameId}`, { method: 'DELETE' }),

  getPublicProfile: (playerId: string) =>
    request<PublicProfile>(`/api/jogadores/${playerId}`),

  listFriends: () => request<{ friends: FriendSummary[] }>('/api/social/amigos'),

  listPendingFriends: () =>
    request<{ requests: Array<{ requesterId: string; displayName: string; avatarUrl: string | null; createdAt: string }> }>(
      '/api/social/amigos/pendentes',
    ),

  addFriend: (playerId: string) =>
    request<{ status: string }>('/api/social/amigos', {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    }),

  acceptFriend: (requesterId: string) =>
    request<{ status: string }>(`/api/social/amigos/${requesterId}/aceitar`, { method: 'POST' }),

  blockPlayer: (playerId: string) =>
    request<{ blocked: boolean }>('/api/social/bloqueios', {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    }),

  unblockPlayer: (blockedId: string) =>
    request<{ blocked: boolean }>(`/api/social/bloqueios/${blockedId}`, { method: 'DELETE' }),

  listBlocked: () =>
    request<{ blocked: Array<{ playerId: string; displayName: string; avatarUrl: string | null }> }>(
      '/api/social/bloqueios',
    ),

  reportPlayer: (payload: {
    reportedId: string;
    reason: 'SPAM' | 'TOXICIDADE' | 'OFENSA' | 'ASSEDIO' | 'HACK' | 'FAKE' | 'OUTRO';
    details: string;
  }) =>
    request<{ reportId: string }>('/api/social/denuncias', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  listNotifications: () => request<{ notifications: NotificationItem[] }>('/api/social/notificacoes'),

  markNotificationRead: (id: string) =>
    request<{ read: boolean }>(`/api/social/notificacoes/${id}/lida`, { method: 'PATCH' }),

  sendPrivateMessage: (receiverId: string, content: string) =>
    request<PrivateMessage>('/api/social/mensagens', {
      method: 'POST',
      body: JSON.stringify({ receiverId, content }),
    }),

  listPrivateMessages: (peerId: string) =>
    request<{ messages: PrivateMessage[] }>(`/api/social/mensagens/${peerId}`),

  listConversations: () =>
    request<{ conversations: Array<{ peerId: string; peerDisplayName: string; peerAvatarUrl: string | null; lastMessage: string; sentAt: string }> }>(
      '/api/social/conversas',
    ),

  getAdminPanel: () => request<AdminPanel>('/api/admin/painel'),

  listAdminPlayers: () => request<{ players: AdminPlayer[] }>('/api/admin/jogadores'),

  searchAdminPlayers: (q: string, limit = 8) =>
    request<{ players: AdminPlayerSearchResult[] }>(
      `/api/admin/jogadores/busca?q=${encodeURIComponent(q)}&limit=${limit}`,
    ),

  getAdminPlayer: (playerId: string) =>
    request<AdminPlayer>(`/api/admin/jogadores/${playerId}`),

  updateAdminPlayer: (
    playerId: string,
    payload: Partial<{
      username: string;
      email: string;
      displayName: string;
      role: 'PLAYER' | 'ADMIN';
      country: string | null;
      birthDate: string | null;
      language: 'pt-BR' | 'en-US' | 'es-ES';
      emailVerified: boolean;
      chatOnline: boolean;
      senha: string;
      rankId: string | null;
    }>,
  ) =>
    request<AdminPlayer>(`/api/admin/jogadores/${playerId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  setAdminPlayerBanned: (playerId: string, banned: boolean) =>
    request<{ playerId: string; isBanned: boolean }>(`/api/admin/jogadores/${playerId}/ban`, {
      method: 'POST',
      body: JSON.stringify({ banned }),
    }),

  deleteAdminPlayer: (playerId: string) =>
    request<{ playerId: string; deleted: boolean }>(`/api/admin/jogadores/${playerId}`, {
      method: 'DELETE',
    }),

  createAdminCategory: (payload: { name: string; slug: string }) =>
    request<{ categoryId: string; name: string; slug: string }>('/api/admin/categorias', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteAdminCategory: (categoryId: string) =>
    request<{ categoryId: string; deleted: boolean }>(`/api/admin/categorias/${categoryId}`, {
      method: 'DELETE',
    }),

  getAdminCategory: (categoryId: string) =>
    request<AdminCategoryDetail>(`/api/admin/categorias/${categoryId}`),

  updateAdminCategory: (
    categoryId: string,
    payload: { name: string; slug: string; active: boolean },
  ) =>
    request<AdminCategoryDetail>(`/api/admin/categorias/${categoryId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  createAdminGame: (payload: { name: string; slug: string; categoryId: string }) =>
    request<{ gameId: string; name: string; slug: string }>('/api/admin/jogos', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteAdminGame: (gameId: string) =>
    request<{ gameId: string; deleted: boolean }>(`/api/admin/jogos/${gameId}`, {
      method: 'DELETE',
    }),

  setAdminGameStatus: (gameId: string, active: boolean) =>
    request<AdminGame>(`/api/admin/jogos/${gameId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    }),

  getAdminGame: (gameId: string) =>
    request<AdminGameDetail>(`/api/admin/jogos/${gameId}`),

  updateAdminGame: (
    gameId: string,
    payload: { name: string; slug: string; active: boolean },
  ) =>
    request<AdminGameDetail>(`/api/admin/jogos/${gameId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  uploadAdminGameCover: (gameId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<{ gameId: string; coverUrl: string }>(`/api/admin/jogos/${gameId}/cover`, {
      method: 'POST',
      body: form,
    });
  },

  setAdminCategoryStatus: (categoryId: string, active: boolean) =>
    request<Category & { categoryId: string }>(`/api/admin/categorias/${categoryId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    }),

  listAdminCategories: () => request<{ categories: Category[] }>('/api/admin/categorias'),

  listAdminPlayerLogs: (playerId: string) =>
    request<AdminPlayerLogs>(`/api/admin/jogadores/${playerId}/logs`),

  listAdminGlobalLogs: () => request<AdminGlobalLogs>('/api/admin/logs'),

  listAdminReports: () => request<{ reports: AdminReport[] }>('/api/admin/denuncias'),

  listAdminActiveRooms: () => request<{ rooms: AdminActiveRoom[] }>('/api/admin/salas-ativas'),

  listAdminGames: () => request<{ games: AdminGame[] }>('/api/admin/jogos'),

  setPlayerRole: (playerId: string, role: 'PLAYER' | 'ADMIN') =>
    request<{ playerId: string; role: string; token?: string }>(
      `/api/admin/jogadores/${playerId}/role`,
      { method: 'PATCH', body: JSON.stringify({ role }) },
    ),

  listCategories: () => request<{ categories: Category[] }>('/api/categorias'),

  listGamesByCategory: (categoryId: string) =>
    request<{ games: Game[] }>(`/api/categorias/${categoryId}/jogos`),

  getLobbyBySlug: (slug: string) =>
    request<LobbyInfo>(`/api/jogos/${encodeURIComponent(slug)}/lobby`),

  getRoom: (roomId: string) => request<RoomInfo>(`/api/salas/${roomId}`),

  listRoomMessages: (roomId: string) =>
    request<{ messages: ChatMessage[] }>(`/api/salas/${roomId}/mensagens`),

  joinRoom: (roomId: string) =>
    request<{ roomId: string; participantCount: number }>(`/api/salas/${roomId}/entrar`, {
      method: 'POST',
    }),

  leaveRoom: (roomId: string) =>
    request<{ roomId: string; participantCount: number }>(`/api/salas/${roomId}/sair`, {
      method: 'POST',
    }),

  sendMessage: (roomId: string, content: string) =>
    request<ChatMessage>(`/api/salas/${roomId}/mensagens`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
};

export type PrivateMessageSocketEvent = PrivateMessage & { type: 'privateMessage' };

export function connectPrivateMessageSocket(onEvent: (event: PrivateMessage) => void) {
  const token = getToken();
  if (!token) {
    return { close: () => undefined };
  }
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(
    `${protocol}://${window.location.host}/ws/social/mensagens?token=${encodeURIComponent(token)}`,
  );
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data) as PrivateMessageSocketEvent | { type: 'connected' };
    if (data.type === 'privateMessage') {
      onEvent(data);
    }
  };
  return ws;
}

export function connectRoomSocket(roomId: string, onEvent: (event: RoomSocketEvent) => void) {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${protocol}://${window.location.host}/ws/salas/${roomId}`);
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data) as RoomSocketEvent;
    if (data.type === 'message' || data.type === 'participantCount') {
      onEvent(data);
    }
  };
  return ws;
}
