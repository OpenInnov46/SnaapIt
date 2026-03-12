export interface MenuItem {
  icon: string;
  label: string;
  action?: () => void;
}

// Router page type
export type Page = '' | 'signup' | 'home';
