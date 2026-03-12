<script>
	import { onMount } from "svelte";
	import { Button, buttonVariants } from "$lib/components/ui/button";
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
	import { Badge } from "$lib/components/ui/badge";
	import {
		ArrowRight,
		Zap,
		CloudCheck,
		ArrowDown,
		Video,
		Sparkles,
		Dot,
		Search,
		Bookmark,
		Brain,
		Link,
		Layers,
	} from "lucide-svelte";
	import { goto } from "$app/navigation";
	import { user } from "$lib/stores/account";
	import * as Dialog from "$lib/components/ui/dialog";

	let scrollY = $state(0);
	let demoSection = $state(null);
	let videoDialogOpen = $state(false);

	const messyBookmarks = [
		{
			title: "untitled",
			url: "github.com/...",
			content: "saved 3 months ago, no description",
			timestamp: "3 months ago",
		},
		{},
		{},
		{},
	];

	// Floating search examples
	const searchExamples = [
		{
			query: "svelte animation lib",
			match: "92%",
			position: "top: 5%; left: 10%;",
		},
		{
			query: "color palette tool",
			match: "87%",
			position: "top: 20%; right: 15%;",
		},
		{
			query: "node diagram library",
			match: "94%",
			position: "top: 40%; left: 15%;",
		},
		{
			query: "react state management",
			match: "89%",
			position: "top: 10%; right: 10%;",
		},
		{
			query: "3d graphics svelte",
			match: "85%",
			position: "top: 45%; left: 20%;",
		},
		{
			query: "css utility framework",
			match: "91%",
			position: "top: 35%; right: 20%;",
		},
	];
</script>

<svelte:head>
	<title>Snaapit - AI-powered bookmark search for developers</title>
	<meta
		name="description"
		content="Never lose a bookmark again. Snaapit uses AI to help you find any saved page by describing what it does, not what it's called."
	/>
</svelte:head>

<svelte:window bind:scrollY />

<!-- Hero section -->
<section class="relative overflow-hidden">
	<!-- Background gradient -->
	<div class="from-background/10 via-primary/5 to-primary/20 absolute inset-0 bg-gradient-to-b"></div>

	<div class="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
		<div class="text-center">
			<div class="mb-4 flex justify-center">
				<Button
					variant="ghost"
					class="bg-primary/10 text-foreground group rounded-full!"
					onclick={() => (videoDialogOpen = true)}
				>
					<Video class="text-primary h-4 w-4" />
					<span class="-mr-1 text-sm font-medium">Watch 1-minute demo</span>
					<ArrowRight class="text-primary h-4 w-4 max-w-0 transition-all group-hover:max-w-4" />
				</Button>
			</div>

			<h1 class="mb-6 text-4xl font-bold sm:text-6xl">
				Find any bookmark by <span class="text-primary">describing what it does</span>
			</h1>

			<p class="text-muted-foreground mx-auto mb-8 max-w-2xl text-lg">
				AI-powered semantic search for your bookmarks. No more scrolling through folders or trying to remember exact
				titles.
			</p>

			<div class="flex flex-col justify-center gap-4 sm:flex-row">
				<Button
					size="lg"
					onclick={() => ($user ? goto("/dashboard") : goto("/login"))}
					class="glint relative overflow-hidden"
				>
					{$user ? "Open dashboard" : "Get started free"}
					<ArrowRight class="h-4 w-4" />
				</Button>
				<Button
					variant="outline"
					size="lg"
					onclick={() => {
						demoSection?.scrollIntoView({ block: "center", behavior: "smooth" });
					}}>See it in action</Button
				>
			</div>
		</div>

		<!-- Bookmark transformation -->
		<div class="relative mx-auto mt-20 grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
			<!-- Before -->
			<div class="relative h-[340px]">
				{#each messyBookmarks as bookmark, index}
					<Card
						class="bg-background dark:border-accent absolute h-45 w-full gap-2 border-transparent shadow-lg"
						style="
									top: {index * 25}px;
									left: {index * 8}px;
									z-index: {messyBookmarks.length - index};
									transform: rotate({(index - 1) * 1.5}deg);
									opacity: {100 - index * 20}%;
								"
					>
						<CardHeader class="pb-3">
							<div class="text-muted-foreground flex items-center justify-between text-xs">
								<span class="truncate">{bookmark?.url}</span>
								<span>{bookmark?.timestamp}</span>
							</div>
							<CardTitle class="text-base">{bookmark?.title}</CardTitle>
						</CardHeader>
						<CardContent>
							<p class="text-muted-foreground h-3/5 truncate text-sm">{bookmark?.content}</p>
							<div class="mt-3 flex gap-2">
								<Badge variant="secondary" class="text-xs">no tags</Badge>
								<Badge variant="secondary" class="text-xs">folder mess</Badge>
							</div>
						</CardContent>
					</Card>
				{/each}
			</div>

			<!-- After -->
			<Card
				class="bg-background dark:border-accent flex max-w-full flex-1 flex-col gap-4 overflow-hidden border-transparent shadow-xl"
			>
				<CardHeader class="border-b">
					<div class="flex items-start justify-between">
						<div class="flex items-center gap-2">
							<div class="border-primary flex h-5 w-5 items-center justify-center rounded-full border-2">
								<Dot class="text-primary h-3 w-3 fill-current" />
							</div>
							<Badge class="bg-success text-xs text-white">87% match</Badge>
						</div>
						<Badge class="text-xs">Svelte</Badge>
					</div>

					<CardTitle class="text-primary mt-1 truncate text-base leading-tight"
					>Svelte Flow - Node-Based UI Library</CardTitle
					>

					<div class="text-muted-foreground mt-1 flex items-center text-xs">
						<span>svelteflow.dev</span>
					</div>
				</CardHeader>
				<CardContent class="flex flex-1 flex-col">
					<div class="flex-1 space-y-3 text-sm">
						<div>
							<p class="text-muted-foreground text-sm">
								A customizable Svelte component for building node-based editors and interactive diagrams. Perfect for
								creating flowcharts, state machines, and visual tools.
							</p>
						</div>

						<div class="text-nowrap">
							<span class="font-semibold">You searched:</span>
							<p class="text-muted-foreground truncate">"library for creating node diagrams in svelte"</p>
						</div>
					</div>

					<div class="text-muted-foreground mt-3 flex items-center justify-between gap-4 border-t pt-3 text-xs">
						<div class="flex flex-wrap gap-2">
							<Badge variant="secondary" class="text-xs">UI Library</Badge>
							<Badge variant="secondary" class="text-xs">Diagrams</Badge>
							<Badge variant="secondary" class="text-xs">Node-based</Badge>
						</div>
						<div>
							<p class="text-muted-foreground text-xs">Saved 2 days ago</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<!-- Arrow indicator -->
			<div
				class="oveflow-hidden bg-background text-primary border-primary absolute top-[42%] left-1/2 z-20 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 transform items-center justify-center rounded-full border-2 shadow-xl lg:top-1/2"
			>
				<ArrowRight class="hidden h-8 w-8 lg:block" />
				<ArrowDown class="h-8 w-8 lg:hidden" />
			</div>
		</div>
	</div>
</section>

<!-- Features section -->
<section class="inset-shadow-xl py-24">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="mb-12 text-center">
			<h2 class="mb-4 text-3xl font-bold leading-tight">
				Stop scrolling through folders. <br />Start <span class="text-primary">describing</span> what you need.
			</h2>
		</div>

		<div class="grid gap-8 md:grid-cols-3">
			<Card class="group bg-accent/20 border-none shadow-none transition">
				<CardHeader>
					<Brain class="text-primary mb-2 h-8 w-8" />
					<CardTitle class="group-hover:text-primary transition">Semantic search</CardTitle>
					<CardDescription>
						Find bookmarks by meaning, not keywords. Search "color palette tool" and find Coolors, even if the word
						"palette" isn't in the title.
					</CardDescription>
				</CardHeader>
			</Card>

			<Card class="group bg-accent/20 border-none shadow-none transition">
				<CardHeader>
					<Zap class="text-primary mb-2 h-8 w-8" />
					<CardTitle class="group-hover:text-primary transition">Instant snap</CardTitle>
					<CardDescription>
						Chrome extension with keyboard shortcuts. Hit Cmd+Shift+B to snap any page. Search with Cmd+Shift+F. Fast,
						native, always there.
					</CardDescription>
				</CardHeader>
			</Card>

			<Card class="group bg-accent/20 border-none shadow-none transition">
				<CardHeader>
					<CloudCheck class="text-primary mb-2 h-8 w-8" />
					<CardTitle class="group-hover:text-primary transition">Cloud sync</CardTitle>
					<CardDescription
					>Access your bookmarks from any device. Snap on desktop, search on laptop, find anywhere. Auto-synced in
						real-time.</CardDescription
					>
				</CardHeader>
			</Card>
		</div>
	</div>
</section>

<!-- Advanced features -->
<section class="pt-8 pb-24">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="space-y-20">
			<!-- AI Auto-tagging -->
			<div class="grid items-center gap-12 lg:grid-cols-2">
				<div>
					<h3 class="mb-4 text-2xl font-bold">Intelligent auto-tagging</h3>
					<p class="text-muted-foreground text-lg leading-relaxed">
						AI automatically tags your bookmarks based on content. Technologies, topics, and categories detected
						instantly. No manual organization needed.
					</p>
				</div>
				<div class="bg-muted/50 overflow-hidden rounded-2xl p-6">
					<div class="bg-background rounded-xl p-4 shadow-sm">
						<div class="mb-3 flex items-center gap-2">
							<Sparkles class="text-primary h-4 w-4" />
							<span class="text-sm font-medium">Auto-detected tags</span>
						</div>
						<div class="flex flex-wrap gap-2">
							<Badge variant="secondary">React</Badge>
							<Badge variant="secondary">State Management</Badge>
							<Badge variant="secondary">Tutorial</Badge>
							<Badge variant="secondary">TypeScript</Badge>
							<Badge variant="secondary">Hooks</Badge>
						</div>
						<p class="text-muted-foreground mt-3 text-xs">
							Based on: "React state management with Zustand - Complete guide"
						</p>
					</div>
				</div>
			</div>

			<!-- Collections -->
			<div class="grid items-center gap-12 lg:grid-cols-2">
				<div>
					<h3 class="mb-4 text-2xl font-bold">Smart collections</h3>
					<p class="text-muted-foreground text-lg leading-relaxed">
						Group related bookmarks into collections. Perfect for projects, research, or learning paths. Share
						collections with your team.
					</p>
				</div>
				<div class="bg-muted/50 rounded-2xl p-6">
					<div class="bg-background rounded-xl p-4 shadow-sm">
						<div class="mb-3 flex items-center justify-between">
							<div class="flex items-center gap-2">
								<Layers class="text-primary h-4 w-4" />
								<span class="text-sm font-medium">My Collections</span>
							</div>
							<Badge class="text-xs">3 active</Badge>
						</div>
						<div class="space-y-2">
							<div class="bg-muted/50 flex items-center justify-between rounded-lg p-3">
								<span class="text-sm">Svelte Resources</span>
								<span class="text-muted-foreground text-xs">24 items</span>
							</div>
							<div class="bg-muted/50 flex items-center justify-between rounded-lg p-3">
								<span class="text-sm">Design Inspiration</span>
								<span class="text-muted-foreground text-xs">18 items</span>
							</div>
							<div class="bg-muted/50 flex items-center justify-between rounded-lg p-3">
								<span class="text-sm">Learning Path</span>
								<span class="text-muted-foreground text-xs">31 items</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Multi-device -->
			<div class="grid items-center gap-12 lg:grid-cols-2">
				<div>
					<h3 class="mb-4 text-2xl font-bold">Multi-device access</h3>
					<p class="text-muted-foreground text-lg leading-relaxed">
						Chrome extension for quick capture. Web dashboard for deep organization. Mobile-friendly search. Your
						bookmarks follow you everywhere.
					</p>
				</div>
				<div class="bg-muted/50 flex items-center justify-center gap-3 overflow-hidden rounded-2xl p-6">
					<div class="bg-background flex flex-col gap-2 rounded-xl p-4 shadow-sm">
						<div class="flex items-center gap-2">
							<div class="bg-primary h-2 w-2 rounded-full"></div>
							<span class="text-xs font-medium">Chrome Extension</span>
						</div>
						<div class="flex items-center gap-2">
							<div class="bg-primary h-2 w-2 rounded-full"></div>
							<span class="text-xs font-medium">Web Dashboard</span>
						</div>
						<div class="flex items-center gap-2">
							<div class="bg-primary h-2 w-2 rounded-full"></div>
							<span class="text-xs font-medium">Mobile Browser</span>
						</div>
						<p class="text-muted-foreground mt-2 text-xs">Synced in real-time</p>
					</div>
				</div>
			</div>

			<!-- Privacy -->
			<div class="grid items-center gap-12 lg:grid-cols-2">
				<div>
					<h3 class="mb-4 text-2xl font-bold">Privacy-first design</h3>
					<p class="text-muted-foreground text-lg leading-relaxed">
						Your bookmarks are encrypted and private. We only process what's needed for search. No selling data, no
						tracking, no BS.
					</p>
				</div>
				<div class="bg-muted/50 rounded-2xl p-6">
					<div class="bg-background rounded-xl p-4 shadow-sm">
						<div class="mb-4 flex items-center gap-2">
							<div class="bg-success/10 text-success flex h-8 w-8 items-center justify-center rounded-full">
								<span class="text-lg">🔒</span>
							</div>
							<span class="text-sm font-medium">Your data is secure</span>
						</div>
						<div class="space-y-2 text-xs">
							<div class="flex items-center gap-2">
								<div class="bg-success h-1.5 w-1.5 rounded-full"></div>
								<span>End-to-end encryption</span>
							</div>
							<div class="flex items-center gap-2">
								<div class="bg-success h-1.5 w-1.5 rounded-full"></div>
								<span>No data selling</span>
							</div>
							<div class="flex items-center gap-2">
								<div class="bg-success h-1.5 w-1.5 rounded-full"></div>
								<span>GDPR compliant</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Keyboard shortcuts -->
			<div class="grid items-center gap-12 lg:grid-cols-2">
				<div>
					<h3 class="mb-4 text-2xl font-bold">Built for speed</h3>
					<p class="text-muted-foreground text-lg leading-relaxed">
						Keyboard shortcuts for everything. Snap, search, and navigate without touching your mouse. Optimized for
						developers who live in the keyboard.
					</p>
				</div>
				<div class="bg-muted/50 overflow-hidden rounded-2xl p-6">
					<div class="bg-background space-y-3 rounded-xl p-4 shadow-sm">
						<div class="flex items-center justify-between">
							<span class="text-sm">Snap current page</span>
							<div class="flex gap-1">
								<Badge variant="secondary" class="text-xs">⌘</Badge>
								<Badge variant="secondary" class="text-xs">Shift</Badge>
								<Badge variant="secondary" class="text-xs">B</Badge>
							</div>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm">Search bookmarks</span>
							<div class="flex gap-1">
								<Badge variant="secondary" class="text-xs">⌘</Badge>
								<Badge variant="secondary" class="text-xs">Shift</Badge>
								<Badge variant="secondary" class="text-xs">F</Badge>
							</div>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm">Open dashboard</span>
							<div class="flex gap-1">
								<Badge variant="secondary" class="text-xs">⌘</Badge>
								<Badge variant="secondary" class="text-xs">K</Badge>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Demo section with floating searches -->
<section class="bg-muted/50 py-24" bind:this={demoSection}>
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="mb-8 text-center">
			<h2 class="mb-4 text-3xl font-bold">Search like you think</h2>
			<p class="text-muted-foreground text-lg">
				Describe what you're looking for. AI understands the context and finds the right bookmark.
			</p>
		</div>

		<!-- Floating search examples -->
		<div
			class="relative mx-auto mb-12 h-[250px] max-w-5xl overflow-hidden mask-y-from-95% mask-y-to-100% mask-x-from-80% mask-x-to-100% sm:h-[375px]"
		>
			{#each searchExamples as example, index}
				{@const sectionTop = demoSection?.offsetTop || 0}
				{@const relativeScroll = Math.min(750, Math.max(0, scrollY - sectionTop + 1000))}
				<div
					class="absolute w-72"
					style="{example.position} z-index: {10 + index}; transform: translateY({relativeScroll *
						(0.01 + (index + 1) * 0.01)}px);"
				>
					<Card class="bg-background shadow-lg">
						<CardHeader class="pb-3">
							<div class="mb-2 flex items-center gap-2">
								<Search class="text-primary h-4 w-4" />
								<span class="text-xs font-medium">Search query</span>
							</div>
							<CardTitle class="text-sm font-normal italic">"{example.query}"</CardTitle>
						</CardHeader>
						<CardContent class="pt-0">
							<div class="flex items-center justify-between">
								<span class="text-muted-foreground text-xs">Match found</span>
								<Badge class="bg-success text-xs text-white">{example.match}</Badge>
							</div>
						</CardContent>
					</Card>
				</div>
			{/each}
		</div>

		<!-- Demo CTA -->
		<div class="text-center">
			<Button size="lg" onclick={() => goto("/demo")}>Try the live demo</Button>
		</div>
	</div>
</section>

<!-- CTA Section -->
<section class="mx-8 my-16">
	<div class="bg-primary text-primary-foreground mx-auto max-w-7xl rounded-3xl px-8 py-12 text-center shadow-xl">
		<Bookmark class="mx-auto mb-8 h-16 w-16 opacity-80" />
		<h2 class="mb-4 text-3xl font-bold">
			Never lose a bookmark again
		</h2>
		<p class="mx-auto mb-8 max-w-lg text-lg opacity-90">
			Join developers and designers who are building their knowledge libraries with Snaapit.
		</p>
		<div class="flex flex-col justify-center gap-4 sm:flex-row">
			<Button variant="secondary" size="lg" onclick={() => goto("/login")}>
				Start for free
				<ArrowRight class="h-4 w-4" />
			</Button>
			<Button variant="secondary" class="bg-muted/50" size="lg" onclick={() => goto("/pricing")}
			>View pricing</Button
			>
		</div>
	</div>
</section>

<!-- Video popup -->
<Dialog.Root bind:open={videoDialogOpen}>
	<Dialog.Content class="w-full max-w-3xl!">
		<Dialog.Header class="h-fit">
			<Dialog.Title>Snaapit demo</Dialog.Title>
		</Dialog.Header>
		<iframe
			class="h-100 w-full"
			src="https://www.youtube.com/embed/demo"
			title="Snaapit demo video"
			frameborder="0"
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
			referrerpolicy="strict-origin-when-cross-origin"
			allowfullscreen
		></iframe>
	</Dialog.Content>
</Dialog.Root>

<style>
    :global(.glint::before) {
        animation: 4s fade-glint 2s infinite;
        background: white;
        filter: blur(30px);
        content: "";
        position: absolute;
        width: 30px;
        z-index: 1;
        height: 200%;
        top: -20px;
        left: 0;
        transform: rotate(30deg);
        pointer-events: none;
        margin-left: -100px;
    }

    @keyframes fade-glint {
        0% {
            margin-left: -100px;
            visibility: visible;
        }

        60% {
            margin-left: calc(100% + 50px);
        }

        100% {
            margin-left: calc(100% + 50px);
        }
    }
</style>