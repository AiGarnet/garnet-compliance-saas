import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ChecklistsService } from './checklists.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const checklistsService = app.get(ChecklistsService);

  console.log('Finding orphaned checklists (files missing from Spaces)...');
  const orphaned = await checklistsService.findOrphanedChecklists();

  if (orphaned.length === 0) {
    console.log('No orphaned checklists found!');
    await app.close();
    return;
  }

  console.log(`Found ${orphaned.length} orphaned checklists:`);
  orphaned.forEach(c => {
    console.log(`- Checklist: ${c.id} (Vendor: ${c.vendorId}, Name: ${c.name})`);
  });

  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('Delete all these orphaned checklists from the database? (y/N): ', async (answer: string) => {
    if (answer.trim().toLowerCase() === 'y') {
      for (const c of orphaned) {
        try {
          await checklistsService.forceDeleteChecklist(c.id, c.vendorId);
          console.log(`Deleted checklist ${c.id}`);
        } catch (err) {
          console.error(`Failed to delete checklist ${c.id}:`, err.message);
        }
      }
      console.log('Cleanup complete.');
    } else {
      console.log('Aborted. No checklists deleted.');
    }
    rl.close();
    await app.close();
  });
}

main().catch(err => {
  console.error('Error running cleanup script:', err);
  process.exit(1);
}); 