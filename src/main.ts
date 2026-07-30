import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

console.log('[INIT] main.ts - bootstrapModule START', performance.now().toFixed(1), 'ms');

platformBrowserDynamic().bootstrapModule(AppModule)
  .then(() => console.log('[INIT] main.ts - bootstrapModule DONE', performance.now().toFixed(1), 'ms'))
  .catch(err => console.error(err));
