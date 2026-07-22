import { startServer } from './composition-root.js';

startServer().catch((err) => {
  console.error(err);
  process.exit(1);
});
