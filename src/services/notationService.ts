import { fetchAPI } from "../utils/FetchAPI"
import type { Notation } from "../models/Notation"

const API_URL_BASE = import.meta.env.VITE_API_URL_BASE

export class NotationService {
    static async getNotations(scoreId: string) {
        return await fetchAPI(API_URL_BASE+'/notation/'+scoreId, {
            method: 'GET',
            credentials: 'include'
        })
    }

    static async createNotation(scoreId: string, notation: Partial<Notation>) {
        return await fetchAPI(API_URL_BASE+'/notation/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                scoreId: scoreId,
                content: notation.content
            }),
        })
    }

    static async updateNotation(id: string, notation: Notation) {
        return await fetchAPI(API_URL_BASE+'/notation/'+id, {
            method: 'PUT',
            credentials: 'include',
            body: {
                content: notation.content
            }
        })
    }
}