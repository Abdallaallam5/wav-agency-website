import { createApp } from './app.js';
import { config } from './config.js';
import { init } from './init.js';

await init();

createApp().listen(config.port, () => console.log(`[crm] http://localhost:${config.port}`));
