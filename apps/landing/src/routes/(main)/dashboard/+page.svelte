<script>
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { Button } from "$lib/components/ui/button";
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
	import { Badge } from "$lib/components/ui/badge";
	import { Search, Trash2, ExternalLink, FolderOpen } from "lucide-svelte";
	import { toast } from "svelte-sonner";
	import { user, session } from "$lib/stores/account";
	import { get } from "svelte/store";

	const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

	let bookmarks = $state([]);
	let folders = $state([]);
	let searchQuery = $state("");
	let searchResults = $state([]);
	let loading = $state(true);
	let activeTab = $state("bookmarks");

	async function apiFetch(path, options = {}) {
		const sess = get(session);
		const token = sess?.access_token;
		if (!token) {
			goto("/login");
			return null;
		}

		const res = await fetch(`${API_URL}${path}`, {
			...options,
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
				...options.headers,
			},
		});

		if (res.status === 401) {
			toast.error("Session expired. Please sign in again.");
			goto("/login");
			return null;
		}
		return res.json();
	}

	onMount(async () => {
		if (!get(user)) {
			goto("/login");
			return;
		}
		await loadData();
	});

	async function loadData() {
		loading = true;
		try {
			const [bookmarkRes, folderRes] = await Promise.all([
				apiFetch("/bookmarks"),
				apiFetch("/folders"),
			]);
			bookmarks = bookmarkRes?.bookmarks || [];
			folders = folderRes || [];
		} catch (err) {
			toast.error("Failed to load data");
		} finally {
			loading = false;
		}
	}

	async function handleSearch() {
		if (!searchQuery.trim()) {
			searchResults = [];
			return;
		}
		try {
			searchResults = await apiFetch(`/bookmarks/search?q=${encodeURIComponent(searchQuery)}`);
		} catch (err) {
			toast.error("Search failed");
		}
	}

	async function deleteBookmark(id) {
		try {
			await apiFetch(`/bookmarks/${id}`, { method: "DELETE" });
			bookmarks = bookmarks.filter((b) => b.id !== id);
			toast.success("Bookmark deleted");
		} catch (err) {
			toast.error("Failed to delete");
		}
	}

	function formatDate(dateStr) {
		return new Date(dateStr).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	}

	const displayBookmarks = $derived(searchResults.length > 0 ? searchResults : bookmarks);
</script>

<svelte:head>
	<title>Dashboard - Snaapit</title>
</svelte:head>

<div class="mx-auto min-h-screen max-w-7xl px-4 py-8">
	{#if !$user}
		<div class="bg-background/20 absolute inset-0 z-30 flex items-center justify-center backdrop-blur-lg">
			<div>
				<h2>Please <a href="/login" class="underline">sign in</a> to use the dashboard.</h2>
			</div>
		</div>
	{/if}

	<!-- Header -->
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Dashboard</h1>
			<p class="text-muted-foreground mt-1">Manage your bookmarks and collections.</p>
		</div>
		<div class="text-muted-foreground text-sm">
			{bookmarks.length} bookmarks · {folders.length} folders
		</div>
	</div>

	<!-- Search -->
	<div class="relative mb-8 max-w-xl">
		<Search class="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
		<input
			type="text"
			bind:value={searchQuery}
			onkeydown={(e) => e.key === "Enter" && handleSearch()}
			placeholder="Search bookmarks semantically..."
			class="border-input bg-background w-full rounded-lg border py-2 pl-10 pr-4 text-sm"
		/>
	</div>

	<!-- Tabs -->
	<div class="mb-6 flex gap-2">
		<Button variant={activeTab === "bookmarks" ? "default" : "outline"} size="sm" onclick={() => (activeTab = "bookmarks")}>
			Bookmarks
		</Button>
		<Button variant={activeTab === "folders" ? "default" : "outline"} size="sm" onclick={() => (activeTab = "folders")}>
			<FolderOpen class="mr-1 h-4 w-4" /> Folders
		</Button>
	</div>

	{#if loading}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _}
				<Card class="animate-pulse">
					<CardHeader><div class="bg-muted h-5 w-3/4 rounded"></div></CardHeader>
					<CardContent><div class="bg-muted h-4 w-full rounded"></div></CardContent>
				</Card>
			{/each}
		</div>
	{:else if activeTab === "bookmarks"}
		{#if displayBookmarks.length === 0}
			<div class="bg-muted/50 rounded-3xl p-8 py-12 text-center">
				<Search class="text-muted-foreground mx-auto mb-4 h-16 w-16" />
				<h3 class="mb-2 text-xl font-semibold">
					{searchQuery ? "No results found" : "No bookmarks yet"}
				</h3>
				<p class="text-muted-foreground mb-6">
					{searchQuery ? "Try a different search term" : "Use the Chrome extension to snap your first bookmark!"}
				</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each displayBookmarks as bookmark}
					<Card class="group transition-shadow hover:shadow-lg">
						<CardHeader class="pb-2">
							<div class="flex items-start justify-between gap-2">
								<CardTitle class="line-clamp-1 text-sm">{bookmark.title}</CardTitle>
								{#if bookmark.similarity}
									<Badge class="bg-success flex-shrink-0 text-xs text-white">
										{Math.round(bookmark.similarity * 100)}%
									</Badge>
								{/if}
							</div>
							<a href={bookmark.url} target="_blank" class="text-muted-foreground flex items-center gap-1 text-xs hover:underline">
								{new URL(bookmark.url).hostname}
								<ExternalLink class="h-3 w-3" />
							</a>
						</CardHeader>
						<CardContent>
							{#if bookmark.description}
								<p class="text-muted-foreground mb-3 line-clamp-2 text-sm">{bookmark.description}</p>
							{/if}
							{#if bookmark.tags?.length > 0}
								<div class="mb-3 flex flex-wrap gap-1">
									{#each bookmark.tags as tag}
										<Badge variant="secondary" class="text-xs">{tag}</Badge>
									{/each}
								</div>
							{/if}
							<div class="flex items-center justify-between">
								<span class="text-muted-foreground text-xs">{formatDate(bookmark.created_at)}</span>
								<Button
									variant="ghost"
									size="sm"
									class="text-destructive opacity-0 group-hover:opacity-100"
									onclick={() => deleteBookmark(bookmark.id)}
								>
									<Trash2 class="h-4 w-4" />
								</Button>
							</div>
						</CardContent>
					</Card>
				{/each}
			</div>
		{/if}
	{:else}
		<!-- Folders -->
		{#if folders.length === 0}
			<div class="bg-muted/50 rounded-3xl p-8 py-12 text-center">
				<FolderOpen class="text-muted-foreground mx-auto mb-4 h-16 w-16" />
				<h3 class="mb-2 text-xl font-semibold">No folders yet</h3>
				<p class="text-muted-foreground">Folders are created automatically when you snap bookmarks.</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each folders as folder}
					<Card class="transition-shadow hover:shadow-lg">
						<CardHeader>
							<div class="flex items-center gap-3">
								<div class="h-3 w-3 rounded-full" style="background: {folder.color || 'var(--primary)'}"></div>
								<CardTitle class="text-base">{folder.name}</CardTitle>
							</div>
						</CardHeader>
					</Card>
				{/each}
			</div>
		{/if}
	{/if}
</div>
