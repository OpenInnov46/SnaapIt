<script>
	import { Button } from "$lib/components/ui/button";
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
	import { Badge } from "$lib/components/ui/badge";
	import { Check, Crown, Mail, Zap, Rocket } from "lucide-svelte";
	import { goto } from "$app/navigation";
	import { isAuthenticated } from "$lib/stores/account";
	import { toast } from "svelte-sonner";

	let billingCycle = $state("yearly");

	const pricingTiers = [
		{
			id: 0,
			name: "Free",
			priceMonthly: 0,
			priceYearly: 0,
			bookmarkLimit: 50,
			features: [
				"50 bookmarks",
				"Local storage only",
				"Basic search",
				"Chrome extension",
				"Manual tagging",
			],
			cta: "Get started",
		},
		{
			id: 1,
			name: "Pro",
			priceMonthly: 3,
			priceYearly: 25,
			bookmarkLimit: "Unlimited",
			features: [
				"Unlimited bookmarks",
				"Cloud sync across devices",
				"AI semantic search",
				"Auto-tagging with AI",
				"Smart collections",
				"Multi-device access",
				"Priority support",
				"Web dashboard",
			],
			cta: "Upgrade to Pro",
			popular: true,
		},
	];

	function formatPrice(tier) {
		if (tier.id === 0) return "Free";
		return billingCycle === "yearly" ? `$${tier.priceYearly}` : `$${tier.priceMonthly}`;
	}

	function getPeriod() {
		return billingCycle === "yearly" ? "/year" : "/month";
	}

	function getMonthlyEquivalent(tier) {
		if (tier.id === 0 || billingCycle === "monthly") return "";
		return `$${(tier.priceYearly / 12).toFixed(2)}/month`;
	}

	function getSavings() {
		const monthly = 3 * 12;
		const yearly = 25;
		return Math.round(((monthly - yearly) / monthly) * 100);
	}

	function handleSubscription(tier) {
		if (tier.id === 0) {
			goto("/login");
			return;
		}
		if (!$isAuthenticated) {
			goto("/login");
			return;
		}
		toast.info("Billing is coming soon! You're on the free plan for now.");
	}
</script>

<svelte:head>
	<title>Pricing - Snaapit</title>
	<meta name="description" content="Simple, transparent pricing for Snaapit. Start free, upgrade when you need more." />
</svelte:head>

<div class="mx-auto max-w-6xl px-4 pt-24 pb-8">
	<!-- Header -->
	<div class="mb-12 text-center">
		<div class="mb-4 flex justify-center">
			<Zap class="text-primary h-12 w-12" />
		</div>
		<h1 class="mb-4 text-4xl font-bold">Simple, honest pricing</h1>
		<p class="text-muted-foreground mx-auto max-w-2xl text-lg">
			Start free, upgrade when you need more. No hidden fees, no surprises.
		</p>
	</div>

	<!-- Billing toggle -->
	<div class="mb-12 flex flex-col items-center justify-center gap-4">
		<div class="bg-muted inline-flex rounded-lg p-1">
			<button
				class="rounded-md px-6 py-2 text-sm font-medium transition-all {billingCycle === 'monthly'
					? 'bg-background shadow-sm'
					: 'text-muted-foreground'}"
				onclick={() => (billingCycle = "monthly")}
			>
				Monthly
			</button>
			<button
				class="rounded-md px-6 py-2 text-sm font-medium transition-all {billingCycle === 'yearly'
					? 'bg-background shadow-sm'
					: 'text-muted-foreground'}"
				onclick={() => (billingCycle = "yearly")}
			>
				Yearly
			</button>
		</div>
		{#if billingCycle === "yearly"}
			<Badge class="bg-success text-white">Save {getSavings()}% with yearly billing</Badge>
		{/if}
	</div>

	<!-- Testimonial -->
	<div class="mb-20 flex flex-col items-center justify-center text-center">
		<blockquote class="text-muted-foreground mb-2 max-w-xl text-lg italic">
			"I used to lose at least 30 minutes a day searching for that one article I saved. Now I just describe what I'm
			looking for and boom, there it is."
		</blockquote>
		<cite class="text-muted-foreground text-sm not-italic"> — Alex, Product Designer </cite>
	</div>

	<!-- Pricing cards -->
	<div class="mb-8 grid gap-8 lg:grid-cols-2 lg:gap-12">
		{#each pricingTiers as tier}
			<Card
				class="group relative {tier.popular
					? 'border-primary shadow-lg lg:scale-105'
					: 'shadow-none'} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
			>
				{#if tier.popular}
					<div class="absolute -top-3 left-1/2 -translate-x-1/2 transform">
						<Badge class="bg-primary text-primary-foreground px-3 py-1">
							<Crown class="mr-1 h-3 w-3" />
							Most popular
						</Badge>
					</div>
				{/if}

				<CardHeader class="pb-2 text-center">
					<CardTitle class="text-2xl">{tier.name}</CardTitle>
					<div class="mt-4">
						<span class="text-primary text-5xl font-bold">{formatPrice(tier)}</span>
						{#if tier.id > 0}
							<span class="text-muted-foreground text-lg">{getPeriod()}</span>
						{/if}
					</div>
					{#if getMonthlyEquivalent(tier)}
						<p class="text-muted-foreground mt-2 text-sm">{getMonthlyEquivalent(tier)}</p>
					{/if}
					<CardDescription class="mt-3 text-lg font-medium">
						{tier.bookmarkLimit} bookmarks
					</CardDescription>
				</CardHeader>

				<CardContent class="flex flex-col items-center gap-6">
					<ul class="w-full space-y-3">
						{#each tier.features as feature}
							<li class="flex items-start space-x-3">
								<div class="bg-primary/10 mt-0.5 flex-shrink-0 rounded-full p-1">
									<Check class="text-primary h-3 w-3" />
								</div>
								<span class="text-sm">{feature}</span>
							</li>
						{/each}
					</ul>

					<Button
						class="group/btn mt-2 w-full transition-all duration-300"
						size="lg"
						variant={tier.popular ? "default" : "outline"}
						onclick={() => handleSubscription(tier)}
					>
						{#if tier.id === 0}
							<Zap class="h-4 w-4 transition-transform group-hover/btn:-rotate-12" />
						{:else}
							<Rocket class="h-4 w-4 transition-transform group-hover/btn:-rotate-12" />
						{/if}
						{tier.cta}
					</Button>
				</CardContent>
			</Card>
		{/each}
	</div>

	<p class="text-muted-foreground mx-auto mb-12 text-center text-sm max-sm:max-w-80">
		All plans include the Chrome extension and web dashboard. Cancel anytime, no questions asked.
	</p>

	<!-- FAQ -->
	<div class="bg-muted/50 mb-12 rounded-3xl p-12">
		<h2 class="mb-8 text-center text-2xl font-bold">Frequently asked questions</h2>
		<div class="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
			<div>
				<h3 class="mb-2 font-semibold">Can I switch plans later?</h3>
				<p class="text-muted-foreground text-sm">
					Absolutely! Start free and upgrade whenever you need cloud sync and AI features.
				</p>
			</div>
			<div>
				<h3 class="mb-2 font-semibold">What happens if I cancel?</h3>
				<p class="text-muted-foreground text-sm">
					You keep access until the end of your billing period, then revert to the free tier. Your bookmarks stay safe.
				</p>
			</div>
			<div>
				<h3 class="mb-2 font-semibold">Do you offer refunds?</h3>
				<p class="text-muted-foreground text-sm">
					Yes! If you're not happy within the first 14 days, we'll refund you. No questions asked.
				</p>
			</div>
			<div>
				<h3 class="mb-2 font-semibold">What payment methods?</h3>
				<p class="text-muted-foreground text-sm">
					We accept all major credit cards via Stripe. Secure, fast, and reliable.
				</p>
			</div>
		</div>
	</div>

	<!-- Contact -->
	<div class="bg-muted/50 mb-12 rounded-3xl p-12 text-center">
		<h2 class="mb-4 text-2xl font-bold">Need something custom?</h2>
		<p class="text-muted-foreground mx-auto mb-8 max-w-md">
			Building a large team or need enterprise features? Let's talk.
		</p>
		<Button href="mailto:hello@snaapit.app" size="lg">
			Contact us
			<Mail class="h-4 w-4" />
		</Button>
	</div>
</div>
