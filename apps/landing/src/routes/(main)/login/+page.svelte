<script>
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { Button } from "$lib/components/ui/button";
	import { Card, CardContent } from "$lib/components/ui/card";
	import { Zap } from "lucide-svelte";
	import { toast } from "svelte-sonner";
	import { createClient } from "@supabase/supabase-js";
	import { authStore } from "$lib/stores/account";

	const supabase = createClient(
		import.meta.env.VITE_SUPABASE_URL || "",
		import.meta.env.VITE_SUPABASE_ANON_KEY || "",
	);

	let loading = $state(false);
	let email = $state("");
	let password = $state("");

	async function handleEmailLogin(e) {
		e.preventDefault();
		loading = true;
		try {
			const { data, error } = await supabase.auth.signInWithPassword({ email, password });
			if (error) throw error;
			authStore.login({ user: data.user, session: data.session });
			goto("/dashboard");
		} catch (err) {
			toast.error(err.message || "Failed to sign in");
		} finally {
			loading = false;
		}
	}

	async function handleOAuthLogin(provider) {
		loading = true;
		try {
			const { error } = await supabase.auth.signInWithOAuth({
				provider,
				options: { redirectTo: window.location.origin + "/login" },
			});
			if (error) throw error;
		} catch (err) {
			toast.error(err.message || `Failed to sign in with ${provider}`);
			loading = false;
		}
	}

	onMount(async () => {
		// Handle OAuth callback
		const { data } = await supabase.auth.getSession();
		if (data.session) {
			authStore.login({ user: data.session.user, session: data.session });
			goto("/dashboard");
		}
	});
</script>

<svelte:head>
	<title>Sign in - Snaapit</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center border-t px-4">
	<div class="flex w-sm flex-col items-center space-y-8">
		<div class="text-center">
			<div class="mb-6 flex justify-center">
				<Zap class="text-primary h-12 w-12" />
			</div>
			<h2 class="text-3xl font-bold">Welcome back</h2>
			<p class="text-muted-foreground mt-2 max-w-80">
				Sign in to manage your bookmarks and search semantically.
			</p>
		</div>

		<Card>
			<CardContent class="space-y-4 lg:w-sm">
				<Button class="w-full" variant="outline" size="lg" onclick={() => handleOAuthLogin("google")} disabled={loading}>
					Continue with Google
				</Button>

				<Button class="w-full" variant="outline" size="lg" onclick={() => handleOAuthLogin("github")} disabled={loading}>
					Continue with GitHub
				</Button>

				<div class="relative my-4">
					<div class="absolute inset-0 flex items-center">
						<div class="border-muted w-full border-t"></div>
					</div>
					<div class="relative flex justify-center text-xs uppercase">
						<span class="bg-background text-muted-foreground px-2">Or</span>
					</div>
				</div>

				<form onsubmit={handleEmailLogin} class="space-y-3">
					<input
						type="email"
						bind:value={email}
						placeholder="Email"
						required
						class="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
					/>
					<input
						type="password"
						bind:value={password}
						placeholder="Password"
						required
						class="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
					/>
					<Button type="submit" class="w-full" size="lg" disabled={loading}>
						{loading ? "Signing in..." : "Sign in with email"}
					</Button>
				</form>
			</CardContent>
		</Card>

		<p class="text-muted-foreground max-w-75 text-center text-xs">
			By signing in, you agree to our
			<a href="/terms" class="hover:underline">Terms of Use</a>
			and
			<a href="/privacy" class="hover:underline">Privacy Policy</a>.
		</p>
	</div>
</div>
