const jsonValidator = require('json-dup-key-validator');
const path = require('path');
const fs = require('fs');
const util = require('util');

const { promisify } = util;
const readDirAsync = promisify(fs.readdir);
const readFileAsync = promisify(fs.readFile);

const loadFilesNames = async directoryPath => await readDirAsync(directoryPath);

const loadFilesContent = async (filesNames, dir) => {
  const filesData = [];
  const duplicatedKeys = [];

  await Promise.all(
    filesNames
      .filter(fileName => fileName.endsWith('.json'))
      .map(async fileName => {
        const fileData = await readFileAsync(`./${dir}/${fileName}`, 'utf8');
        const parsedFileData = await JSON.parse(fileData);
        filesData.push({
          fileName,
          fileData: parsedFileData
        });

        const duplicatedKey = await jsonValidator.validate(fileData, false);
        if (duplicatedKey) {
          duplicatedKeys.push({
            type: '[DUPLICATED]',
            key: duplicatedKey,
            fileName
          });
        }
      })
  );

  return [filesData, duplicatedKeys];
};

const getAllFilesData = async dir => {
  const directoryPath = path.join(__dirname, dir);
  const filesNames = await loadFilesNames(directoryPath);
  return await loadFilesContent(filesNames, dir);
};

const createKeysList = filesData => {
  return filesData
    .map(data => {
      return Object.keys(data.fileData);
    })
    .reduce((acc, curr) => [...acc, ...curr], []);
};

const countKeysInFiles = keysList => {
  const countedKeys = keysList.reduce((prev, cur) => {
    prev[cur] = (prev[cur] || 0) + 1;
    return prev;
  }, {});
  return countedKeys;
};

const countJsonFiles = filesData => filesData.length;

const findBadKeys = (
  countedKeysList,
  countedFiles,
  filesData,
  duplicatedKeys
) => {
  const errors = [...duplicatedKeys];
  Object.keys(countedKeysList)
    .filter(key => countedKeysList[key] < countedFiles)
    .forEach(key => {
      // if (countedKeysList[key] < countedFiles) {
      for (const number in filesData) {
        const { fileData: singleFileData } = filesData[number];
        const { fileName } = filesData[number];
        if (key in singleFileData) {
          errors.push({
            type: '[BAD]',
            key,
            fileName
          });
        }
      }
    });

  return errors;
};

// Disable console usage linting errors as here error logging is performed.
/* eslint-disable no-console */
const printResult = errors => {
  if (errors !== undefined && errors.length !== 0) {
    errors.map(error => {
      console.error(`${error.type} key: ${error.key} in => ${error.fileName}`);
    });
  } else {
    console.log('[OK]');
  }
};
/* eslint-enable no-console */

const argument =
  process.argv.length < 3 ? 'locales' : process.argv[process.argv.length - 1];

const compareLanguageKeys = async dir => {
  const [filesData, duplicatedKeys] = await getAllFilesData(dir);
  const keyList = createKeysList(filesData);
  const countedKeysList = countKeysInFiles(keyList);
  const countedFiles = countJsonFiles(filesData);
  const errors = findBadKeys(
    countedKeysList,
    countedFiles,
    filesData,
    duplicatedKeys
  );
  printResult(errors);
};

compareLanguageKeys(argument);

export {
  loadFilesNames,
  loadFilesContent,
  countKeysInFiles,
  createKeysList,
  findBadKeys,
  countJsonFiles,
  getAllFilesData,
  printResult
};
