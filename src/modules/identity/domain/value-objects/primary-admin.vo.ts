import { ApplicationError } from '@shared/application/application.error.js';
import type { Jogador } from '../jogador/jogador.aggregate.js';

export const PRIMARY_ADMIN_USERNAME = 'admin';

export function isPrimaryAdminUsername(username: string): boolean {
  return username.trim().toLowerCase() === PRIMARY_ADMIN_USERNAME;
}

export function isPrimaryAdmin(jogador: Jogador): boolean {
  return isPrimaryAdminUsername(jogador.username.toString());
}

export function assertPrimaryAdminProtected(jogador: Jogador): void {
  if (!isPrimaryAdmin(jogador)) return;
  throw new ApplicationError(
    `O administrador principal (@${PRIMARY_ADMIN_USERNAME}) não pode ser alterado, banido, rebaixado ou excluído`,
  );
}
