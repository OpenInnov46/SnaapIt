<script>
	import { goto } from "$app/navigation";
	import { Button } from "$lib/components/ui/button";
	import { Card, CardContent } from "$lib/components/ui/card";
	import { Zap } from "lucide-svelte";
	import { toast } from "svelte-sonner";
	import { createClient } from "@supabase/supabase-js";
	import { authStore } from "$lib/stores/account";

	const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

	const supabase = createClient(
		import.meta.env.VITE_SUPABASE_URL || "",
		import.meta.env.VITE_SUPABASE_ANON_KEY || ""
	);

	let loading = $state(false);
	let fullName = $state("");
	let email = $state("");
	let password = $state("");

	async function handleEmailSignup(e) {
		e.preventDefault();
		loading = true;
		try {
			const res = await fetch(`${apiUrl}/auth/signup`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password, fullName }),
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.message || "Failed to create account");

			if (json.user?.identities?.length === 0) {
				toast.error("An account with this email already exists. Please sign in.");
				goto("/login");
				return;
			}

			// Backend now always returns a session — log the user in directly
			if (json.session) {
				authStore.login({ user: json.user, session: json.session });
				toast.success(json.isAdmin ? "Admin account created!" : "Account created!");
				goto("/dashboard");
			} else {
				toast.success("Account created! Please sign in.");
				goto("/login");
			}
		} catch (err) {
			toast.error(err.message || "Failed to create account");
		} finally {
			loading = false;
		}
	}

	async function handleOAuthSignup(provider) {
		loading = true;
		try {
			const { error } = await supabase.auth.signInWithOAuth({
				provider,
				options: { redirectTo: window.location.origin + "/auth/callback" },
			});
			if (error) throw error;
		} catch (err) {
			toast.error(err.message || `Failed to sign up with ${provider}`);
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Sign up - Snaapit</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center border-t px-4">
	<div class="flex w-sm flex-col items-center space-y-8">
		<div class="text-center">
			<div class="mb-6 flex justify-center">
				<Zap class="text-primary h-12 w-12" />
			</div>
			<h2 class="text-3xl font-bold">Create your account</h2>
			<p class="text-muted-foreground mt-2 max-w-80">
				Start organizing your bookmarks with AI-powered semantic search.
			</p>
		</div>

		<Card>
			<CardContent class="space-y-4 lg:w-sm">
				<Button
					class="w-full"
					variant="outline"
					size="lg"
					onclick={() => handleOAuthSignup("google")}
					disabled={loading}
				>
					Continue with Google
				</Button>

				<Button
					class="w-full"
					variant="outline"
					size="lg"
					onclick={() => handleOAuthSignup("github")}
					disabled={loading}
				>
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

				<form onsubmit={handleEmailSignup} class="space-y-3">
					<input
						type="text"
						bind:value={fullName}
						placeholder="Full name"
						required
						class="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
					/>
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
						placeholder="Password (min. 8 characters)"
						required
						minlength="8"
						class="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
					/>
					<Button type="submit" class="w-full" size="lg" disabled={loading}>
						{loading ? "Creating account..." : "Create account"}
					</Button>
				</form>

				<div class="text-center text-sm">
					<span class="text-muted-foreground">Already have an account?</span>
					<a href="/login" class="text-primary ml-1 font-medium hover:underline">Sign in</a>
				</div>
			</CardContent>
		</Card>

		<p class="text-muted-foreground max-w-75 text-center text-xs">
			By creating an account, you agree to our
			<a href="/terms" class="hover:underline">Terms of Use</a>
			and
			<a href="/privacy" class="hover:underline">Privacy Policy</a>.
		</p>
	</div>
</div>
