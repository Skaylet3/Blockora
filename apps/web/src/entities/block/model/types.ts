export type BlockType = 'Note' | 'Task' | 'Snippet' | 'Idea';
export type BlockStatus = 'active' | 'archived';

export interface Block {
	id: string;
	title: string;
	content: string;
	type: BlockType;
	tags: string[];
	status: BlockStatus;
	updatedAt: string;
	createdAt: string;
}
