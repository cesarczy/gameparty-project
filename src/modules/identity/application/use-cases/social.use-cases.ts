import { ApplicationError, ForbiddenError, NotFoundError } from '@shared/application/application.error.js';
import { resolveJogadorRank, rankToDto } from '../../domain/value-objects/player-rank.js';
import type { JogadorRepository } from '../ports/jogador.repository.js';
import { JogadorId } from '../../domain/value-objects/jogador-id.vo.js';
import type { PrismaSocialRepository } from '../../infrastructure/persistence/prisma-social.repository.js';

export class AtualizarConfiguracoesUseCase {
  constructor(private readonly jogadorRepo: JogadorRepository) {}

  async execute(input: {
    playerId: string;
    profanityFilterEnabled?: boolean;
    chatOnline?: boolean;
    theme?: string;
    language?: string;
  }) {
    const jogador = await this.jogadorRepo.findById(JogadorId.create(input.playerId));
    if (!jogador) throw new NotFoundError('Jogador', input.playerId);

    jogador.atualizarConfiguracoes({
      profanityFilterEnabled: input.profanityFilterEnabled,
      chatOnline: input.chatOnline,
      theme: input.theme,
      language: input.language,
    });
    jogador.registrarAtividade();
    await this.jogadorRepo.save(jogador);

    return {
      profanityFilterEnabled: jogador.profanityFilterEnabled,
      chatOnline: jogador.chatOnline,
      theme: jogador.theme,
      language: jogador.language,
    };
  }
}

export class ObterPerfilPublicoUseCase {
  constructor(
    private readonly jogadorRepo: JogadorRepository,
    private readonly social: PrismaSocialRepository,
  ) {}

  async execute(input: { playerId: string; viewerId?: string }) {
    const jogador = await this.jogadorRepo.findById(JogadorId.create(input.playerId));
    if (!jogador) throw new NotFoundError('Jogador', input.playerId);

    if (input.viewerId && input.viewerId !== input.playerId) {
      const blocked = await this.social.isBlocked(input.viewerId, input.playerId);
      if (blocked) throw new ForbiddenError('Perfil indisponível');
    }

    const rank = rankToDto(
      resolveJogadorRank({
        createdAt: jogador.createdAt,
        role: jogador.role,
        rankId: jogador.rankId,
        isBanned: jogador.estaBanido(),
        username: jogador.username.toString(),
      }),
    );
    return {
      playerId: jogador.id.toString(),
      displayName: jogador.displayName.toString(),
      avatarUrl: jogador.avatarUrl,
      rank,
      isBanned: jogador.estaBanido(),
      isOnline: jogador.estaOnlineParaChat(),
      createdAt: jogador.createdAt.toISOString(),
    };
  }
}

export class SocialUseCases {
  constructor(
    private readonly jogadorRepo: JogadorRepository,
    private readonly social: PrismaSocialRepository,
  ) {}

  async addFriend(requesterId: string, addresseeId: string) {
    if (requesterId === addresseeId) {
      throw new ApplicationError('Você não pode adicionar a si mesmo');
    }
    const target = await this.jogadorRepo.findById(JogadorId.create(addresseeId));
    if (!target) throw new NotFoundError('Jogador', addresseeId);
    if (await this.social.isBlocked(requesterId, addresseeId)) {
      throw new ForbiddenError('Não foi possível enviar convite');
    }

    await this.social.requestFriend(requesterId, addresseeId);
    await this.social.createNotification({
      jogadorId: addresseeId,
      type: 'AMIZADE',
      title: 'Novo pedido de amizade',
      body: 'Alguém quer ser seu amigo no GameParty.',
      payload: { requesterId },
    });
    return { status: 'PENDING' };
  }

  async acceptFriend(addresseeId: string, requesterId: string) {
    await this.social.acceptFriend(requesterId, addresseeId);
    await this.social.createNotification({
      jogadorId: requesterId,
      type: 'AMIZADE',
      title: 'Amizade aceita',
      body: 'Seu pedido de amizade foi aceito.',
      payload: { addresseeId },
    });
    return { status: 'ACCEPTED' };
  }

  async listFriends(playerId: string) {
    const friends = await this.social.listFriends(playerId);
    return {
      friends: friends.map((f) => ({
        playerId: f.id,
        displayName: f.displayName,
        avatarUrl: f.avatarUrl,
        isOnline: f.chatOnline && f.lastSeenAt
          ? Date.now() - f.lastSeenAt.getTime() < 5 * 60 * 1000
          : f.chatOnline,
      })),
    };
  }

  async listPending(playerId: string) {
    const rows = await this.social.listPendingRequests(playerId);
    return {
      requests: rows.map((r) => ({
        requesterId: r.requesterId,
        displayName: r.requester.displayName,
        avatarUrl: r.requester.avatarUrl,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  async blockPlayer(blockerId: string, blockedId: string) {
    await this.social.blockPlayer(blockerId, blockedId);
    return { blocked: true };
  }

  async unblockPlayer(blockerId: string, blockedId: string) {
    await this.social.unblockPlayer(blockerId, blockedId);
    return { blocked: false };
  }

  async listBlocked(blockerId: string) {
    const rows = await this.social.listBlocked(blockerId);
    return {
      blocked: rows.map((b) => ({
        playerId: b.id,
        displayName: b.displayName,
        avatarUrl: b.avatarUrl,
      })),
    };
  }

  async reportPlayer(input: {
    reporterId: string;
    reportedId: string;
    reason: 'SPAM' | 'TOXICIDADE' | 'OFENSA' | 'ASSEDIO' | 'HACK' | 'FAKE' | 'OUTRO';
    details: string;
  }) {
    if (input.reporterId === input.reportedId) {
      throw new ApplicationError('Denúncia inválida');
    }
    const report = await this.social.createReport(input);
    await this.social.createNotification({
      jogadorId: input.reportedId,
      type: 'DENUNCIA',
      title: 'Denúncia registrada',
      body: 'Sua denúncia foi recebida e será analisada.',
      payload: { reportId: report.id },
    });
    return { reportId: report.id };
  }

  async listNotifications(playerId: string) {
    const rows = await this.social.listNotifications(playerId);
    return {
      notifications: rows.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        payload: n.payload,
        read: n.read,
        createdAt: n.createdAt.toISOString(),
      })),
    };
  }

  async markNotificationRead(playerId: string, notificationId: string) {
    await this.social.markNotificationRead(notificationId, playerId);
    return { read: true };
  }

  async sendPrivateMessage(senderId: string, receiverId: string, content: string) {
    if (senderId === receiverId) throw new ApplicationError('Mensagem inválida');
    if (await this.social.isBlocked(senderId, receiverId)) {
      throw new ForbiddenError('Não é possível enviar mensagem');
    }
    const msg = await this.social.sendPrivateMessage(senderId, receiverId, content.trim());
    await this.social.createNotification({
      jogadorId: receiverId,
      type: 'MENSAGEM',
      title: 'Nova mensagem privada',
      body: `${msg.sender.displayName} enviou uma mensagem.`,
      payload: { senderId, messageId: msg.id },
    });
    return {
      messageId: msg.id,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      senderDisplayName: msg.sender.displayName,
      content: msg.content,
      sentAt: msg.sentAt.toISOString(),
    };
  }

  async listPrivateMessages(playerId: string, peerId: string) {
    const rows = await this.social.listPrivateMessages(playerId, peerId);
    return {
      messages: rows.map((m) => ({
        messageId: m.id,
        senderId: m.senderId,
        receiverId: m.receiverId,
        senderDisplayName: m.sender.displayName,
        content: m.content,
        sentAt: m.sentAt.toISOString(),
      })),
    };
  }

  async listConversations(playerId: string) {
    const rows = await this.social.listPrivateConversations(playerId);
    return {
      conversations: rows.map((m) => {
        const peer = m.senderId === playerId ? m.receiver : m.sender;
        return {
          peerId: peer.id,
          peerDisplayName: peer.displayName,
          peerAvatarUrl: peer.avatarUrl,
          lastMessage: m.content,
          sentAt: m.sentAt.toISOString(),
        };
      }),
    };
  }
}
