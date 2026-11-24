import app from './app';
import { connectDb, usingEmbedded } from './config/db';
import { User } from './models';
import { seed } from './scripts/seed';

const port = Number(process.env.X_ZOHO_CATALYST_LISTEN_PORT ?? process.env.PORT ?? 4000); // Catalyst AppSail sets X_ZOHO_CATALYST_LISTEN_PORT

(async () => {
  await connectDb();
  // First run with the embedded DB: seed demo data so the app works on day one.
  if (usingEmbedded && (await User.countDocuments()) === 0) {
    console.log('[seed] empty database, seeding demo data...');
    await seed(true);
  }
  app.listen(port, () => console.log(`API ready on http://localhost:${port}`));
})().catch((e) => { console.error(e); process.exit(1); });
