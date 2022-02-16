const fs = require('fs');
const {
  moveVideoToFolder,
  renameFile,
  processFolder,
  resetAllFolderName,
} = require('./utils');

async function main(args) {
  const myArgs = args.slice(2);
  const FOLDER_PATH = myArgs[0];
  const folderExist = fs.existsSync(FOLDER_PATH);
  // console.log(myArgs);
  // resetAllFolderName(FOLDER_PATH);
  if (!FOLDER_PATH) {
    console.error('Please enter a folder path as an argument');
  } else if (!folderExist) {
    console.error('The folder that you entered does not exist');
  } else {
    // removeNonVideoFile(FOLDER_PATH);
    console.log('Renaming video files...');
    await renameFile(FOLDER_PATH);
    // console.log('Moving video files to folders...');
    // await moveVideoToFolder(FOLDER_PATH);
    // console.log('Obtaining metadata...');
    // await processFolder(FOLDER_PATH);
  }
  console.log('All completed. Exiting...');
}
main(process.argv);
