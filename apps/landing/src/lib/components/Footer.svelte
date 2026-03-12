<script>
	import { Zap } from "lucide-svelte";
</script>

<footer class="mt-auto border-t">
	<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		<div class="grid grid-cols-1 gap-8 md:grid-cols-4">
			<!-- Company info -->
			<div class="col-span-1 md:col-span-2">
				<div class="mb-4 flex items-center space-x-2">
					<Zap class="text-primary h-6 w-6" />
					<span class="text-lg font-bold">Snaapit</span>
				</div>
				<p class="text-muted-foreground mb-4 text-sm">
					AI-powered semantic search for your bookmarks. Find any saved page by describing what it does.
				</p>
			</div>

			<!-- Quick links -->
			<div>
				<h3 class="mb-4 font-semibold">Product</h3>
				<ul class="text-muted-foreground space-y-2 text-sm">
					<li><a href="/pricing" class="hover:text-foreground transition-colors">Pricing</a></li>
					<li><a href="/login" class="hover:text-foreground transition-colors">Get started</a></li>
				</ul>
			</div>

			<!-- Legal -->
			<div>
				<h3 class="mb-4 font-semibold">Legal</h3>
				<ul class="text-muted-foreground space-y-2 text-sm">
					<li><a href="/privacy" class="hover:text-foreground transition-colors">Privacy Policy</a></li>
					<li><a href="/terms" class="hover:text-foreground transition-colors">Terms of Use</a></li>
				</ul>
			</div>
		</div>

		<div class="mt-8 border-t pt-8">
			<p class="text-muted-foreground text-center text-sm">
				&copy; {new Date().getFullYear()} Snaapit. All rights reserved.
			</p>
		</div>
	</div>
</footer>
