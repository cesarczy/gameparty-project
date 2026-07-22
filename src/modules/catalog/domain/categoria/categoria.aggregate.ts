import { DomainError } from '@shared/domain/domain.error.js';
import { CategoriaId } from '../value-objects/categoria-id.vo.js';
import { Slug } from '../value-objects/slug.vo.js';

export class CategoriaNomeInvalidoError extends DomainError {
  constructor() {
    super('Nome da categoria é obrigatório');
    this.name = 'CategoriaNomeInvalidoError';
  }
}

export interface CategoriaProps {
  id: CategoriaId;
  name: string;
  slug: Slug;
  active: boolean;
}

export class Categoria {
  private constructor(private props: CategoriaProps) {
    if (!props.name.trim()) {
      throw new CategoriaNomeInvalidoError();
    }
  }

  static create(input: { name: string; slug: string }): Categoria {
    return new Categoria({
      id: CategoriaId.create(),
      name: input.name.trim(),
      slug: Slug.create(input.slug),
      active: true,
    });
  }

  static reconstitute(props: CategoriaProps): Categoria {
    return new Categoria(props);
  }

  get id(): CategoriaId {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): Slug {
    return this.props.slug;
  }

  get active(): boolean {
    return this.props.active;
  }

  desativar(): void {
    this.props.active = false;
  }

  ativar(): void {
    this.props.active = true;
  }
}
