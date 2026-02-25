import { Test, TestingModule } from '@nestjs/testing';
import { BlockController } from './block.controller';
import { BlockService } from './block.service';

const mockBlockService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockUser = { sub: 'user-1', email: 'user@test.com' };

const sampleBlock = {
  id: 'block-1',
  userId: 'user-1',
  title: 'Test Block',
  content: 'Content',
};

describe('BlockController', () => {
  let controller: BlockController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlockController],
      providers: [{ provide: BlockService, useValue: mockBlockService }],
    }).compile();

    controller = module.get<BlockController>(BlockController);
  });

  it('findAll — delegates to blockService.findAll with userId', async () => {
    mockBlockService.findAll.mockResolvedValue([sampleBlock]);

    const result = await controller.findAll(mockUser);

    expect(mockBlockService.findAll).toHaveBeenCalledWith('user-1');
    expect(result).toEqual([sampleBlock]);
  });

  it('findOne — delegates to blockService.findOne with id and userId', async () => {
    mockBlockService.findOne.mockResolvedValue(sampleBlock);

    const result = await controller.findOne('block-1', mockUser);

    expect(mockBlockService.findOne).toHaveBeenCalledWith('block-1', 'user-1');
    expect(result).toEqual(sampleBlock);
  });

  it('create — delegates to blockService.create with userId and dto', async () => {
    const dto = { title: 'New Block', content: 'Content' };
    mockBlockService.create.mockResolvedValue({ ...sampleBlock, ...dto });

    const result = await controller.create(mockUser, dto as any);

    expect(mockBlockService.create).toHaveBeenCalledWith('user-1', dto);
    expect(result).toHaveProperty('title', 'New Block');
  });

  it('update — delegates to blockService.update with id, userId, and dto', async () => {
    const dto = { title: 'Updated' };
    mockBlockService.update.mockResolvedValue({ ...sampleBlock, ...dto });

    const result = await controller.update('block-1', mockUser, dto as any);

    expect(mockBlockService.update).toHaveBeenCalledWith(
      'block-1',
      'user-1',
      dto,
    );
    expect(result).toHaveProperty('title', 'Updated');
  });

  it('remove — delegates to blockService.remove with id and userId', async () => {
    mockBlockService.remove.mockResolvedValue({
      ...sampleBlock,
      status: 'DELETED',
    });

    const result = await controller.remove('block-1', mockUser);

    expect(mockBlockService.remove).toHaveBeenCalledWith('block-1', 'user-1');
    expect(result).toHaveProperty('status', 'DELETED');
  });
});
