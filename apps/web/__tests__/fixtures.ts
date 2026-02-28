import type { Block } from '@/entities/block';

let seq = 0;

/** Reset sequence counter between test files to keep IDs deterministic. */
export function resetSeq() {
	seq = 0;
}

/** Factory that creates a typed Block with safe defaults. Override any field per-test. */
export function createBlock(overrides: Partial<Block> = {}): Block {
	seq++;
	return {
		id: `test-${seq}`,
		userId: 'user-1',
		title: `Test Block ${seq}`,
		content: `Content for block ${seq}`,
		type: 'NOTE',
		tags: [],
		status: 'ACTIVE',
		visibility: 'PRIVATE',
		createdAt: '2026-01-01T00:00:00.000Z',
		updatedAt: '2026-01-01T00:00:00.000Z',
		archivedAt: null,
		...overrides,
	};
}
