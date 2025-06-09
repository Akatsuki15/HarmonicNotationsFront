import { fetchAPI } from "../utils/FetchAPI"

const API_URL_BASE = import.meta.env.VITE_API_URL_BASE

console.log(API_URL_BASE)

export class ScoreService {
    static async getScores() {
        return await fetchAPI(API_URL_BASE+'/scores', {
            method: 'GET',
            credentials: 'include'
        })
    }

    static async getScore(id: string) {
        return await fetchAPI(API_URL_BASE+'/scores/'+id, {
            method: 'GET',
            credentials: 'include'
        })
    }

    static async createScore(file: File, userId: string, title: string) {
        const formData = new FormData()
        formData.append('pdfFile', file)
        formData.append('userId', userId)
        formData.append('title', title)

        // Agregar estos logs para depuración
        console.log('File type:', file.type)
        console.log('File name:', file.name)
        console.log('FormData entries:')
        for (const pair of formData.entries()) {
            console.log(pair[0], pair[1])
        }

        return await fetchAPI(API_URL_BASE+'/score/newScore', {
            method: 'POST',
            credentials: 'include',
            body: formData
        })
    }
}