import { CountSerializer } from '@app/common/serializers';

import { SessionsProvider } from './sessions.provider';

export class SessionsResolver {
  constructor(private readonly provider: SessionsProvider) {}

  async count(): Promise<CountSerializer> {
    return CountSerializer.build(0);
  }
}
