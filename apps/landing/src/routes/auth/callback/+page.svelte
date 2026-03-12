<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/account';
	import { createClient } from '@supabase/supabase-js';

	let status = $state('Finalising sign-in…');
	let isError = $state(false);

	const supabase = createClient(
		import.meta.env.VITE_SUPABASE_URL || '',
		import.meta.env.VITE_SUPABASE_ANON_KEY || ''
	);

	onMount(async () => {
		try {
			// 1. PKCE flow: Supabase automatically picks up the ?code= param
			const { data, error } = await supabase.auth.getSession();

			if (error) throw error;

			if (data.session) {
				authStore.login({ user: data.session.user, session: data.session });
				status = 'Success! Redirecting…';
				setTimeout(() => goto('/dashboard'), 800);
				return;
			}

			// 2. Implicit flow fallback: tokens in URL hash fragment
			const hash = window.location.hash.substring(1);
			if (hash) {
				const params = new URLSearchParams(hash);
				const accessToken = params.get('access_token');
				const refreshToken = params.get('refresh_token');
				const hashError = params.get('error');

				if (hashError) throw new Error(params.get('error_description') || hashError);

				if (accessToken) {
					// Set the session from the hash tokens
					const { data: setData, error: setError } = await supabase.auth.setSession({
						access_token: accessToken,
						refresh_token: refreshToken || ''
					});
					if (setError) throw setError;
					authStore.login({ user: setData.session?.user, session: setData.session });
					status = 'Success! Redirecting…';
					setTimeout(() => goto('/dashboard'), 800);
					return;
				}
			}

			// If we reach here with no session, redirect to login
			status = 'No session found. Redirecting to login…';
			isError = true;
			setTimeout(() => goto('/login'), 2000);
		} catch (err) {
			status = err.message || 'Authentication failed.';
			isError = true;
			setTimeout(() => goto('/login'), 3000);
		}
	});
</script>

<svelte:head>
	<title>Snaapit — Signing in…</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center">
	<div class="text-center">
		{#if isError}
			<p class="text-destructive text-lg">{status}</p>
		{:else}
			<div class="border-primary mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"></div>
			<p class="text-muted-foreground">{status}</p>
		{/if}
	</div>
</div>
