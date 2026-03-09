import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { CurrentUser } from './current-user.decorator';

describe('CurrentUser decorator', () => {
  // Helper to extract the factory function from a param decorator
  function getParamDecoratorFactory() {
    class Test {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      handler(@CurrentUser() _user: unknown) {}
    }
    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, Test, 'handler');
    const key = Object.keys(metadata)[0];
    return metadata[key].factory;
  }

  it('extracts the user property from the request', () => {
    const factory = getParamDecoratorFactory();
    const mockPayload = { sub: 'user-1', email: 'test@example.com' };
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ user: mockPayload }),
      }),
    } as unknown as ExecutionContext;

    const result = factory(undefined, ctx);
    expect(result).toEqual(mockPayload);
  });

  it('returns undefined when user is not set on request', () => {
    const factory = getParamDecoratorFactory();
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as unknown as ExecutionContext;

    const result = factory(undefined, ctx);
    expect(result).toBeUndefined();
  });
});
