export type BlockType = 'NOTE' | 'TASK' | 'SNIPPET' | 'IDEA';
export type BlockStatus = 'ACTIVE' | 'ARCHIVED' | 'DELETED';
export type BlockVisibility = 'PRIVATE' | 'PUBLIC';

export interface Block {
	id: string;
	userId: string;
	title: string;
	content: string;
	type: BlockType;
	status: BlockStatus;
	visibility: BlockVisibility;
	tags: string[];
	createdAt: string;
	updatedAt: string;
	archivedAt: string | null;
}
