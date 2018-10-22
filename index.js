const jsonValidator = require('json-dup-key-validator');
const path = require('path');
const fs = require('fs');
const util = require('util');

const { promisify } = util;
const readDirAsync = promisify(fs.readdir);
const readFileAsync = promisify(fs.readFile);

const laodFilesNames = async directoryPath => await readDirAsync(directoryPath);

const loadFilesContent = async (filesNames, dir) => {
  const filesData = [];
  const duplicatedKeys = [];

  await Promise.all(
    filesNames.map(async fileName => {
      if (fileName.endsWith('.json')) {
        fileData = await readFileAsync(`./${dir}/${fileName}`, 'utf8');
        parsedFileData = await jsonValidator.parse(fileData, true);
        filesData.push({
          fileName,
          fileData: parsedFileData
        });

        const duplicatedKey = await jsonValidator.validate(fileData, false);
        if (duplicatedKey) {
          duplicatedKeys.push({
            type: '[DUPLICATED]',
            key: duplicatedKey,
            fileName: fileName
          });
        }
      }
    })
  );

  return [filesData, duplicatedKeys];
};

const getAllFilesData = async dir => {
  const directoryPath = path.join(__dirname, dir);
  const filesNames = await laodFilesNames(directoryPath);
  return await loadFilesContent(filesNames, dir);
};

const createKeysList = filesData => {
  const keysList = [];
  for (const key in filesData) {
    const filesKeysList = filesData[key].fileData;
    for (const key in filesKeysList) {
      keysList.push(key);
    }
  }

  return keysList;
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
  Object.keys(countedKeysList).forEach(key => {
    if (countedKeysList[key] < countedFiles) {
      for (const number in filesData) {
        const { fileData: singleFileData } = filesData[number];
        const { fileName } = filesData[number];
        if (key in singleFileData) {
          errors.push({
            type: '[BAD]',
            key: key,
            fileName: fileName
          });
        }
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

compareLanguageKeys = async dir => {
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

compareLanguageKeys(process.argv[process.argv.length - 1]);
