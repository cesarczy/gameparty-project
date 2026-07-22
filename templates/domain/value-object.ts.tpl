import { DomainError } from '@shared/domain/domain.error';

export class {{Name}} {
  private constructor(private readonly value: {{Type}}) {}

  static create(raw: {{Type}}): {{Name}} {
    // validate
    return new {{Name}}(raw);
  }

  toString(): string {
    return String(this.value);
  }

  equals(other: {{Name}}): boolean {
    return this.value === other.value;
  }
}
