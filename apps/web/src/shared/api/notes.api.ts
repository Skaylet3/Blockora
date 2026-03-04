import { request } from './http-client';

export interface NoteResponse {
	id: string;
	title: string;
	content: string;
	storageId: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreateNoteBody {
	title: string;
	content?: string;
	storageId: string;
}

export interface UpdateNoteBody {
	title?: string;
	content?: string;
}

export const notesApi = {
	getNotesByStorage(storageId: string): Promise<NoteResponse[]> {
		return request<NoteResponse[]>(`/notes?storageId=${storageId}`);
	},

	createNote(body: CreateNoteBody): Promise<NoteResponse> {
		return request<NoteResponse>('/notes', { method: 'POST', body });
	},

	updateNote(id: string, body: UpdateNoteBody): Promise<NoteResponse> {
		return request<NoteResponse>(`/notes/${id}`, { method: 'PATCH', body });
	},

	deleteNote(id: string): Promise<void> {
		return request<void>(`/notes/${id}`, { method: 'DELETE' });
	},
};
