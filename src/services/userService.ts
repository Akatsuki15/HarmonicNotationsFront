import { fetchAPI } from "../utils/FetchAPI";

const API_URL_BASE = import.meta.env.VITE_API_URL_BASE

export class UserService {
    static async getCurrentUser() {
        console.log('Obteniendo usuario actual...');
        try {
            const response = await fetchAPI(API_URL_BASE+'/user/me', {
                method: 'GET',
                credentials: 'include'
            });
            console.log('Respuesta de getCurrentUser:', response);
            return response;
        } catch (error) {
            console.error('Error en getCurrentUser:', error);
            throw error;
        }
    }
}