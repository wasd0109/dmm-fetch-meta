const { default: axios } = require('axios');
const fs = require('fs');
const requrest = require('request');
const {
  moveVideoToFolder,
  getMetadata,
  downloadImage,
  SEARCHABLE_FOLDER_REGEX,
  resetAllFolderName,
  renameFile,
  processFolder,
} = require('./utils');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const request = require('request');
const path = require('path');

function main(args) {
  const myArgs = args.slice(2);
  const FOLDER_PATH = myArgs[0];

  if (!FOLDER_PATH) {
    console.error('Please enter a folder path as an argument');
  } else {
    renameFile(FOLDER_PATH);
    moveVideoToFolder(FOLDER_PATH);
    processFolder();
  }
}

main(process.argv);
