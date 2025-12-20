import http from 'k6/http';
import { BASE_URL } from './base_url.js';

export function login(email, password){
    let responseLogin = http.post(
          `${BASE_URL}/auth/login`,
          JSON.stringify({
            email,
            password
          }),
          {
            headers: {
              'Content-Type': 'application/json'
            }});    
    return responseLogin;
}