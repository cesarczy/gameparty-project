import { {{Aggregate}} } from '../../domain/{{aggregate}}/{{aggregate}}.aggregate';
import { {{Aggregate}}Repository } from '../ports/{{aggregate}}.repository';

export interface {{Name}}Input {
  // fields
}

export interface {{Name}}Output {
  // fields
}

export class {{Name}}UseCase {
  constructor(private readonly repo: {{Aggregate}}Repository) {}

  async execute(input: {{Name}}Input): Promise<{{Name}}Output> {
    const entity = {{Aggregate}}.create({ /* map input */ });
    await this.repo.save(entity);
    return { /* map output */ };
  }
}
