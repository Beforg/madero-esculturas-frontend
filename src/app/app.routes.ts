import { Routes } from '@angular/router';

import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
import { LandingModalRoutePlaceholderComponent } from './features/landing/pages/landing-modal-route-placeholder.component';
import { LandingPageComponent } from './features/landing/pages/landing-page.component';
import { LoginComponent } from './features/login/login.component';
import { AdminComponent } from './features/admin/admin.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
	{
		path: '',
		component: MainLayoutComponent,
		children: [
			{
				path: '',
				component: LandingPageComponent,
				children: [
					{
						path: 'catalogo/:reference',
						component: LandingModalRoutePlaceholderComponent
					}
				]
			}
		]
	},
	{
		path: 'login',
		component: LoginComponent
	},
	{
		path: 'admin',
		component: AdminComponent,
		canActivate: [authGuard]
	},
	{
		path: '**',
		redirectTo: ''
	}
];
