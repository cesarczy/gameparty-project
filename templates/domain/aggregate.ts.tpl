import { DomainError } from '@shared/domain/domain.error';

export class {{Name}} {
  private constructor(private readonly props: {{Name}}Props) {
    // enforce invariants
  }

  static create(props: {{Name}}Props): {{Name}} {
    return new {{Name}}(props);
  }

  static reconstitute(props: {{Name}}Props): {{Name}} {
    return new {{Name}}(props);
  }

  // domain behavior methods
}

export interface {{Name}}Props {
  // define properties
}
