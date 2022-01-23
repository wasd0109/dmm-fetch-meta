const { default: axios } = require('axios');
const fs = require('fs');
const cheerio = require('cheerio');

const SEARCHABLE_FOLDER_REGEX = /^([A-Za-z])+-([0-9])+$/i;
const VIDEO_REGEX = /([A-Za-z]\w+-[0-9]+).*mp4/i;
const MULTIPART_VIDEO_REGEX = /([A-Za-z])+-([0-9])+-([A-Za-z0-9]).mp4/i;

const idToDMMId = (id) => {
  const arr = id.split('-');

  return `${arr[0].toLowerCase()}${arr[1].padStart(5, 0)}`;
};

// const removeNonVideoFile = (folderPath) => {
//   const results = fs.readdirSync(folderPath);
//   const notMatchList = results.filter(
//     (result) => !result.match(/([A-Za-z]\w+-[0-9]+)/)
//   );
//   for (let notMatch of notMatchList) {
//     const filePath = `${folderPath}\\${notMatch}`;
//     if (fs.lstatSync(filePath).isFile()) {
//       fs.unlinkSync(filePath);
//       console.log(`${filePath} removed`);
//     } else if (fs.lstatSync(filePath).isDirectory()) {
//       removeNonVideoFile(folderPath);
//     }
//   }
// };

const renameFile = (folderPath) => {
  const results = fs.readdirSync(folderPath);
  for (let result of results) {
    const pathTo = concatPath(folderPath, result);
    if (result.includes('.mp4')) {
      const matches = result.match(/([A-Za-z]+-[0-9]+)/);
      if (matches) {
        const ID = matches[0];
        const extension = result.split('.').at(-1);
        const newFilename = `${ID}.${extension}`;
        if (newFilename != result) {
          try {
            const newPath = concatPath(folderPath, newFilename);
            fs.renameSync(pathTo, newPath);
            console.log(`Renamed file ${result} to ${newFilename}`);
          } catch (e) {
            console.error(e);
          }
        }
      } else {
        console.log(
          `Could not rename file. THe file ${result} does not contain string that match the XXXX-123 format`
        );
      }
    } else if (fs.lstatSync(pathTo).isDirectory()) {
      renameFile(pathTo);
    } else {
      console.log(`${result} ignored. Not a MP4 file`);
    }
  }
};

const moveVideoToFolder = (folderPath) => {
  const results = fs.readdirSync(folderPath);
  for (let result of results) {
    const isVideo = VIDEO_REGEX.test(result);

    // const isMultipart = MULTIPART_VIDEO_REGEX.test(result);
    if (isVideo) {
      const newFilename = filePathToNewFilename(result);
      const newFolderPath = `${folderPath}\\${result
        .replace(/.mp4/i, '')
        .toUpperCase()}`;
      const extension = result.split('.')[1].toLowerCase();
      if (!fs.existsSync(newFolderPath)) {
        fs.mkdirSync(newFolderPath);
      }
      try {
        const oldPath = concatPath(folderPath, result);
        const newPath = concatPath(
          newFolderPath,
          `${newFilename}.${extension}`
        );
        if (fs.existsSync(newPath)) {
          console.error(`${newPath} exists, will not overwrite`);
        } else {
          fs.renameSync(oldPath, newPath);
          console.log(
            `Moved file ${result} to ${newFolderPath}\\${newFilename}`
          );
        }
      } catch (e) {
        console.log(e);
      }
    }
  }
};

const getMetadata = async (id) => {
  const dmmSearchURL = 'https://www.dmm.co.jp/search/=/searchstr=';
  const isDMMSearchable = SEARCHABLE_FOLDER_REGEX.test(id);
  if (isDMMSearchable) {
    const searchStrArray = id.split('-');
    const res = await axios.get(
      `${dmmSearchURL}${searchStrArray[0]}%20${searchStrArray[1]}/limit=300`
    );
    const $ = cheerio.load(res.data);

    const itemList = [];
    $('#list')
      .find('li')
      // @ts-ignore
      .each((index, item) => itemList.push(item));

    const correctResult = itemList.filter((item) => {
      const $ = cheerio.load(item);
      // @ts-ignore
      const link = $('a').attr().href;
      if (link.includes(idToDMMId(id))) {
        return true;
      }
      return false;
    });
    if (correctResult.length) {
      const item = cheerio.load(correctResult[0]);
      const { src: imageUrl, alt: title } = item('img').attr();
      const imageUrlComponent = imageUrl.split('/');
      const dmmId = imageUrlComponent[imageUrlComponent.length - 2];

      return { title, dmmId };
    } else {
      console.log(`Failed to obtain metadata for ${id}`);
      return { title: null, dmmId: null };
    }
  }
};

const downloadImage = async (dmmId, folderPath, filename) => {
  const imageURL = `https://pics.dmm.co.jp/digital/video/${dmmId}/${dmmId}pl.jpg`;
  const imagePath = concatPath(folderPath, `${filename}.jpg`);
  const fileExist = fs.existsSync(imagePath);
  if (!fileExist) {
    const res = await axios.get(imageURL, { responseType: 'stream' });
    res.data.pipe(fs.createWriteStream(imagePath));
  } else {
    console.log('A file of the same name exist. Image will not be saved');
  }
};

const resetAllFolderName = (folderPath) => {
  const results = fs.readdirSync(folderPath);
  for (let result of results) {
    if (/([A-Za-z])+-([0-9])+/.test(result)) {
      const ID = result.match(/([A-Za-z])+-([0-9])+/)[0];
      fs.renameSync(`${folderPath}\\${result}`, `${folderPath}\\${ID}`);
    }
  }
};

const processFolder = async (folderPath) => {
  const results = fs.readdirSync(folderPath);
  const searchable = results.filter((result) =>
    SEARCHABLE_FOLDER_REGEX.test(result)
  );
  for (let itemId of searchable) {
    console.log(`Obtaining metadata for ${itemId}`);
    try {
      const { title, dmmId } = await getMetadata(itemId);
      if (title && dmmId) {
        const currentFolderPath = concatPath(folderPath, itemId);
        const sanitizedTitle = sanitizeTitle(title);
        const newFolderPath = concatPath(
          folderPath,
          `[${itemId.toUpperCase()}]${sanitizedTitle}`
        );
        if (fs.existsSync(newFolderPath)) {
          const results = fs.readdirSync(currentFolderPath);
          for (let result of results) {
            const newPath = concatPath(newFolderPath, result);
            if (!fs.existsSync(newPath)) {
              fs.renameSync(
                concatPath(currentFolderPath, result),
                concatPath(newFolderPath, result)
              );
            } else {
              console.error(`File exist at ${newPath}, will not overwrite`);
              continue;
            }
          }
        } else {
          fs.renameSync(currentFolderPath, newFolderPath);
        }

        await downloadImage(dmmId, newFolderPath, itemId);
        console.log(`Metadata for ${itemId} obtained\nTitle: ${title}`);
      }
    } catch (e) {
      console.log(e);
      console.log('Error at ' + itemId);
    }
  }
};

const concatPath = (folderPath, ...path) => {
  return path.reduce((acc, path) => acc + '\\' + path, folderPath + '\\');
};

const sanitizeTitle = (title) => {
  return title.replace(':', '：').replace('/', '／').replace('*', '');
};

const filePathToNewFilename = (filePath) => {
  return filePath.match(VIDEO_REGEX)[0].split('.')[0].toUpperCase();
};

module.exports = {
  moveVideoToFolder,
  getMetadata,
  downloadImage,
  resetAllFolderName,
  renameFile,
  processFolder,
  // removeNonVideoFile,
  SEARCHABLE_FOLDER_REGEX,
  VIDEO_REGEX,
};
