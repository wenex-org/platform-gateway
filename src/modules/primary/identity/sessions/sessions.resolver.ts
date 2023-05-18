import { CountSerializer } from '@app/common/serializers';

import { SessionsProvider } from './sessions.provider';
import { Query, Resolver } from '@nestjs/graphql';

@Resolver(() => CountSerializer)
export class SessionsResolver {
  constructor(private readonly provider: SessionsProvider) {}

  @Query(() => CountSerializer)
  async total(): Promise<CountSerializer> {
    console.log(0);
    return CountSerializer.build(10);
  }
}
