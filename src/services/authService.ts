import type { User } from "../../src/models/User"
import { fetchAPI } from "../utils/FetchAPI"

const API_URL_BASE = import.meta.env.VITE_API_URL_BASE

console.log(API_URL_BASE)

export class AuthService {
    static async registerUser(user: Partial<User>) {
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
      return await fetchAPI(API_URL_BASE+'/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
    })
  } 
}