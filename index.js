const { moveVideoToFolder, renameFile, processFolder } = require('./utils');

function main(args) {
  const myArgs = args.slice(2);
  const FOLDER_PATH = myArgs[0];
  console.log(myArgs);
  if (!FOLDER_PATH) {
    console.error('Please enter a folder path as an argument');
  } else {
    renameFile(FOLDER_PATH);
    moveVideoToFolder(FOLDER_PATH);
    processFolder();
  }
}
main(process.argv);
