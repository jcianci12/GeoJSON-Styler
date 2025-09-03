import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

console.log('[DEBUG] main.ts: Application starting...');

if (environment.production) {
  console.log('[DEBUG] main.ts: Production mode enabled');
  enableProdMode();
} else {
  console.log('[DEBUG] main.ts: Development mode');
}

console.log('[DEBUG] main.ts: Bootstrapping AppModule...');

platformBrowserDynamic().bootstrapModule(AppModule)
  .then(() => {
    console.log('[DEBUG] main.ts: AppModule bootstrapped successfully');
  })
  .catch(err => {
    console.error('[DEBUG] main.ts: Error bootstrapping AppModule:', err);
  });
