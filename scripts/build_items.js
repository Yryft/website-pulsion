const fs = require('fs');
const path = require('path');
const axios = require('axios');
const AdmZip = require('adm-zip');

const repo = 'NotEnoughUpdates/NotEnoughUpdates-REPO';
const branch = 'master';
const folderToExtract = 'items';
const zipUrl = `https://github.com/${repo}/archive/refs/heads/${branch}.zip`;
const folderPath = path.join(process.cwd(), `NotEnoughUpdates-REPO-master/${folderToExtract}`);
const output = {};

async function getNeuData() {
  console.log("Downloading NEU's REPO...");
  const { data } = await axios.get(zipUrl, { responseType: 'arraybuffer' });
  const zip = new AdmZip(data);
  console.log('Extracting...');
  zip.getEntries().forEach(entry => {
    if (entry.entryName.startsWith(`${repo.split('/').pop()}-${branch}/${folderToExtract}`)) {
      const outPath = path.join(process.cwd(), entry.entryName);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, entry.getData());
    }
  });
  console.log('.json files downloaded!');
}

function processFiles() {
  for (const fn of fs.readdirSync(folderPath)) {
    if (!fn.endsWith('.json')) continue;
    const data = JSON.parse(fs.readFileSync(path.join(folderPath, fn), 'utf-8'));
    const item_id = data.internalname || '';
    let name = data.displayname || '';
    if (!item_id) continue;
    if (name.includes('Enchanted Book')) {
      name = item_id.replace(/[_;]/g, ' ').replace(/\bultimate\b/gi, '')
                    .trim().replace(/\s+/g, ' ')
                    .split(' ')
                    .map(w => w[0].toUpperCase() + w.slice(1).toLowerCase())
                    .join(' ');
    }
    output[item_id] = { name };
  }
  fs.rmSync('NotEnoughUpdates-REPO-master', { recursive: true, force: true });
  fs.writeFileSync(path.join(process.cwd(), 'data/items.json'),
                   JSON.stringify(output, null, 2));
  console.log('Succès : items.json mis à jour.');
}

async function main() {
  await getNeuData();
  processFiles();
}

main();
