import { IS_PUBLIC_KEY, Public } from './public.decorator';

describe('Public decorator', () => {
  it('sets IS_PUBLIC_KEY metadata to true on the target', () => {
    @Public()
    class TestController {}

    const metadata = Reflect.getMetadata(IS_PUBLIC_KEY, TestController);
    expect(metadata).toBe(true);
  });

  it('exports IS_PUBLIC_KEY as "isPublic"', () => {
    expect(IS_PUBLIC_KEY).toBe('isPublic');
  });
});
