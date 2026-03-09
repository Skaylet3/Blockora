import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('exposes a db property (PrismaClient instance)', () => {
    expect(service.db).toBeDefined();
    // PrismaClient exposes $disconnect as a function
    expect(typeof service.db.$disconnect).toBe('function');
  });

  it('calls db.$disconnect on module destroy', async () => {
    const spy = vi.spyOn(service.db, '$disconnect').mockResolvedValue(undefined);
    await service.onModuleDestroy();
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });
});
