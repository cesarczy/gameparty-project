import type { PrismaClient, ReportReason } from '@prisma/client';

export class PrismaSocialRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async isBlocked(a: string, b: string): Promise<boolean> {
    const row = await this.prisma.jogadorBloqueio.findFirst({
      where: {
        OR: [
          { blockerId: a, blockedId: b },
          { blockerId: b, blockedId: a },
        ],
      },
    });
    return row !== null;
  }

  async createNotification(input: {
    jogadorId: string;
    type: 'AMIZADE' | 'MENSAGEM' | 'CONVITE' | 'DENUNCIA';
    title: string;
    body: string;
    payload?: Record<string, unknown>;
  }) {
    return this.prisma.notificacao.create({
      data: {
        jogadorId: input.jogadorId,
        type: input.type,
        title: input.title,
        body: input.body,
        payload: input.payload ?? undefined,
      },
    });
  }

  async requestFriend(requesterId: string, addresseeId: string) {
    return this.prisma.jogadorAmizade.upsert({
      where: {
        requesterId_addresseeId: { requesterId, addresseeId },
      },
      create: { requesterId, addresseeId, status: 'PENDING' },
      update: {},
    });
  }

  async acceptFriend(requesterId: string, addresseeId: string) {
    return this.prisma.jogadorAmizade.update({
      where: {
        requesterId_addresseeId: { requesterId, addresseeId },
      },
      data: { status: 'ACCEPTED' },
    });
  }

  async listFriends(playerId: string) {
    const rows = await this.prisma.jogadorAmizade.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ requesterId: playerId }, { addresseeId: playerId }],
      },
      include: {
        requester: true,
        addressee: true,
      },
    });

    return rows.map((row) => {
      const friend = row.requesterId === playerId ? row.addressee : row.requester;
      return friend;
    });
  }

  async listPendingRequests(playerId: string) {
    return this.prisma.jogadorAmizade.findMany({
      where: { addresseeId: playerId, status: 'PENDING' },
      include: { requester: true },
    });
  }

  async blockPlayer(blockerId: string, blockedId: string) {
    await this.prisma.jogadorAmizade.deleteMany({
      where: {
        OR: [
          { requesterId: blockerId, addresseeId: blockedId },
          { requesterId: blockedId, addresseeId: blockerId },
        ],
      },
    });

    return this.prisma.jogadorBloqueio.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      create: { blockerId, blockedId },
      update: {},
    });
  }

  async unblockPlayer(blockerId: string, blockedId: string) {
    return this.prisma.jogadorBloqueio.delete({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
  }

  async listBlocked(blockerId: string) {
    const rows = await this.prisma.jogadorBloqueio.findMany({
      where: { blockerId },
      include: { blocked: true },
    });
    return rows.map((r) => r.blocked);
  }

  async createReport(input: {
    reporterId: string;
    reportedId: string;
    reason: ReportReason;
    details?: string;
  }) {
    return this.prisma.denuncia.create({ data: input });
  }

  async listNotifications(jogadorId: string) {
    return this.prisma.notificacao.findMany({
      where: { jogadorId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markNotificationRead(id: string, jogadorId: string) {
    return this.prisma.notificacao.updateMany({
      where: { id, jogadorId },
      data: { read: true },
    });
  }

  async sendPrivateMessage(senderId: string, receiverId: string, content: string) {
    return this.prisma.mensagemPrivada.create({
      data: { senderId, receiverId, content },
      include: { sender: true, receiver: true },
    });
  }

  async listPrivateMessages(playerId: string, peerId: string) {
    return this.prisma.mensagemPrivada.findMany({
      where: {
        OR: [
          { senderId: playerId, receiverId: peerId },
          { senderId: peerId, receiverId: playerId },
        ],
      },
      include: { sender: true, receiver: true },
      orderBy: { sentAt: 'asc' },
      take: 100,
    });
  }

  async listPrivateConversations(playerId: string) {
    const rows = await this.prisma.mensagemPrivada.findMany({
      where: {
        OR: [{ senderId: playerId }, { receiverId: playerId }],
      },
      orderBy: { sentAt: 'desc' },
      take: 200,
      include: { sender: true, receiver: true },
    });

    const map = new Map<string, (typeof rows)[number]>();
    for (const row of rows) {
      const peerId = row.senderId === playerId ? row.receiverId : row.senderId;
      if (!map.has(peerId)) map.set(peerId, row);
    }
    return [...map.values()];
  }

  async countOpenReports() {
    return this.prisma.denuncia.count({ where: { status: 'ABERTA' } });
  }

  async countOnlinePlayers() {
    const since = new Date(Date.now() - 5 * 60 * 1000);
    return this.prisma.jogador.count({
      where: {
        email: { not: 'system@gameparty.com.br' },
        chatOnline: true,
        bannedAt: null,
        lastSeenAt: { gte: since },
      },
    });
  }

  async countActiveRooms() {
    return this.prisma.salaParticipante.groupBy({
      by: ['salaId'],
    }).then((rows) => rows.length);
  }

  async countNewPlayersToday() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return this.prisma.jogador.count({ where: { createdAt: { gte: start } } });
  }

  async listOpenReports() {
    const rows = await this.prisma.denuncia.findMany({
      where: { status: 'ABERTA' },
      include: {
        reporter: { select: { id: true, displayName: true } },
        reported: { select: { id: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => ({
      reportId: row.id,
      reason: row.reason,
      details: row.details,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      reporter: {
        playerId: row.reporter.id,
        displayName: row.reporter.displayName,
      },
      reported: {
        playerId: row.reported.id,
        displayName: row.reported.displayName,
      },
    }));
  }

  async listActiveRooms() {
    const grouped = await this.prisma.salaParticipante.groupBy({ by: ['salaId'] });
    if (grouped.length === 0) return [];

    const rows = await this.prisma.sala.findMany({
      where: { id: { in: grouped.map((row) => row.salaId) } },
      include: {
        jogo: { select: { name: true, slug: true } },
        participantes: {
          include: { jogador: { select: { id: true, displayName: true } } },
        },
      },
      orderBy: { title: 'asc' },
    });

    return rows.map((row) => ({
      roomId: row.id,
      title: row.title,
      gameName: row.jogo.name,
      gameSlug: row.jogo.slug,
      participantCount: row.participantes.length,
      participants: row.participantes.map((participant) => ({
        playerId: participant.jogador.id,
        displayName: participant.jogador.displayName,
      })),
    }));
  }
}
