import client from './client';

export async function register({ username, email, password }) {
    const { data } = await client.post('/auth/register', {
        username,
        email,
        password,
    });
    return data; // UserOut
}

export async function login({ username, password }) {
    const { data } = await client.post('/auth/login', {
        username,
        password,
    });
    return data; // { access_token, token_type }
}