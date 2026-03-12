export async function handleError({ error, status, message }) {
    if (status !== 404) console.error(error.message);
    return { message };
}
