<script>
	import { Sun, Moon, Eclipse, Zap, LogOut } from "lucide-svelte";
	import Button from "./ui/button/button.svelte";
	import { page } from "$app/state";
	import { setMode, userPrefersMode } from "mode-watcher";
	import { goto } from "$app/navigation";
	import { authStore, user } from "$lib/stores/account";

	const navigation = [
		{ name: "Home", href: "/" },
		{ name: "Pricing", href: "/pricing" },
	];

	const themes = ["light", "dark", "system"];

	function toggleTheme() {
		const currentIndex = themes.findIndex((item) => item === userPrefersMode.current);
		const nextIndex = (currentIndex + 1) % 3;
		setMode(themes[nextIndex]);
	}

	let pageScrollY = $state(0);
</script>

<svelte:window bind:scrollY={pageScrollY} />

<nav class="fixed top-0 right-0 left-0 z-50">
	<div
		class="flex w-full justify-center transition-[padding] duration-300 {pageScrollY > 10 ? 'p-4' : ''}"
	>
		<div
			class="bg-background flex h-18 w-full max-w-7xl justify-between rounded-xl border p-4 duration-300 {pageScrollY >
			10
				? 'shadow-xl'
				: 'border-transparent'}"
		>
			<div class="flex items-center">
				<a href="/" class="flex items-center space-x-2">
					<Zap class="text-primary h-8 w-8 hover:scale-90 transition" />
					<span class="text-xl font-bold">SnaapIt</span>
				</a>

				<div class="hidden md:ml-8 md:flex md:space-x-2">
					{#each navigation as item}
						<a
							href={item.href}
							class="text-muted-foreground hover:text-foreground px-2 py-2 text-sm transition-colors"
							class:text-foreground={page.url.pathname === item.href}
						>
							{item.name}
						</a>
					{/each}
				</div>
			</div>

			<div class="flex items-center space-x-4">
				{#if $user}
					<Button href="/dashboard" variant="outline">Dashboard</Button>
					<Button variant="ghost" size="sm" onclick={() => { authStore.logout(); goto('/'); }}>
						<LogOut class="h-4 w-4" />
					</Button>
				{:else}
					<Button href="/login" variant="outline">
						<span class="max-sm:hidden">Get started</span>
					</Button>
				{/if}

				<Button variant="ghost" size="sm" onclick={toggleTheme}>
					{#if userPrefersMode.current === "light"}
						<Sun class="h-4 w-4" />
					{:else if userPrefersMode.current === "dark"}
						<Moon class="h-4 w-4" />
					{:else}
						<Eclipse class="h-4 w-4" />
					{/if}
				</Button>
			</div>
		</div>
	</div>
</nav>
