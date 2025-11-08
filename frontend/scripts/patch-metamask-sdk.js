import fs from 'fs';
import path from 'path';

const packageJsonPath = path.resolve(process.cwd(), 'node_modules', '@metamask', 'sdk', 'package.json');

fs.readFile(packageJsonPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading @metamask/sdk package.json:', err);
    return;
  }

  const packageJson = JSON.parse(data);
  if (packageJson.devDependencies && packageJson.devDependencies['@react-native-async-storage/async-storage']) {
    delete packageJson.devDependencies['@react-native-async-storage/async-storage'];
    fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8', (err) => {
      if (err) {
        console.error('Error writing @metamask/sdk package.json:', err);
      } else {
        console.log('Successfully patched @metamask/sdk/package.json');
      }
    });
  }
});
