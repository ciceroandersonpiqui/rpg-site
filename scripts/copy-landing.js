import { mkdirSync, cpSync } from 'fs';

try {
  mkdirSync('dist', { recursive: true });
  cpSync('landing', 'dist', { recursive: true });
  console.log('✅ Landing copiada para dist com sucesso.');
} catch (e) {
  console.error('❌ Falha ao copiar landing:', e);
  process.exit(1);
}
