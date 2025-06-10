import type { User } from "../../src/models/User"
import { fetchAPI } from "../utils/FetchAPI"

const API_URL_BASE = import.meta.env.VITE_API_URL_BASE

console.log(API_URL_BASE)

export class AuthService {
    static async registerUser(user: Partial<User>) {
        console.log('Registrando usuario:', user);
        return await fetchAPI(API_URL_BASE+'/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(user),
            credentials: 'include'
        })
    }

    static async loginUser(email: string, password: string) {
        console.log('Iniciando sesión con:', email);
        const response = await fetchAPI(API_URL_BASE+'/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        });
        console.log('Respuesta del login:', response);
        return response;
    }
}