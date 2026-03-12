<script lang="ts">
  import { Router, type RouteConfig, RouteResult, goto } from '@mateothegreat/svelte5-router';
  import SignIn from './routes/SignIn.svelte';
  import SignUp from './routes/SignUp.svelte';
  import Home from './routes/Home.svelte';
  import Toast from './lib/components/Toast.svelte';

  const routes: RouteConfig[] = [
    {
      path: '',
      component: SignIn,
    },
    {
      path: 'signup',
      component: SignUp,
    },
    {
      path: 'home',
      component: Home,
    },
  ];

  const isLogin = async (route: RouteResult): Promise<boolean> => {
    const authToken = await chrome.storage.local.get('authToken');
    console.log('Auth Token:', authToken);
    const isAuthenticated = Boolean(authToken.authToken);

    const currentPath = route.route?.path || '';

    // Si on est sur la page de connexion
    if (currentPath === '') {
      if (isAuthenticated) {
        goto('home'); // Rediriger vers home si connecté
        return false; // Bloquer la navigation vers sign-in
      }
      return true; // Permettre d'afficher sign-in si non connecté
    }

    // Si on est sur la page d'inscription
    if (currentPath === 'signup') {
      if (isAuthenticated) {
        goto('home'); // Rediriger vers home si connecté
        return false; // Bloquer la navigation vers signup
      }
      return true; // Permettre signup si non connecté
    }

    // Si on est sur la page home
    if (currentPath === 'home') {
      if (!isAuthenticated) {
        goto(''); // Rediriger vers sign-in si non connecté
        return false; // Bloquer la navigation vers home
      }
      return true; // Permettre home si connecté
    }

    return true; // Par défaut, permettre la navigation
  };
</script>

<Toast />
<Router hooks={{
  pre: [isLogin]
}} {routes} />