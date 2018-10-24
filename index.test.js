import {
  loadFilesNames,
  loadFilesContent,
  countKeysInFiles,
  createKeysList,
  findBadKeys,
  countJsonFiles,
  getAllFilesData,
  printResult
} from './index';

const path = require('path');

const dir = 'testing_locales';
const directoryPath = path.join(__dirname, dir);

describe('Should check if functions are working properly', () => {
  it(`Should load the files names inside /${dir}/ as an Array`, async () => {
    const filesNames = await loadFilesNames(directoryPath);
    expect(Array.isArray([filesNames])).toBe(true);
  });

  it('Should load the content of the JSON files and return duplicated keys', async () => {
    const filesNames = await loadFilesNames(directoryPath);
    const filesContent = await loadFilesContent(filesNames, dir);
    expect(Array.isArray([filesContent])).toBe(true);
  });

  it('Should find [DUPLICATE] key', async () => {
    const filesNames = await loadFilesNames(directoryPath);
    const filesContent = await loadFilesContent(filesNames, dir);
    const [, duplicatedKeys] = filesContent;
    expect(duplicatedKeys).not.toBe(undefined);
  });

  it('Should create key list', async () => {
    const filesNames = await loadFilesNames(directoryPath);
    const filesContent = await loadFilesContent(filesNames, dir);
    const keyList = createKeysList(filesContent[0]);
    expect(keyList).not.toBe(undefined);
  });

  it('Should count keys', async () => {
    const filesNames = await loadFilesNames(directoryPath);
    const filesContent = await loadFilesContent(filesNames, dir);
    const keyList = createKeysList(filesContent[0]);
    const countedBadKeys = Object.values(countKeysInFiles(keyList));
    expect(countedBadKeys).toEqual([2, 1, 2, 2, 1]);
  });

  it('Should count JSON files', async () => {
    const [filesData] = await getAllFilesData(dir);
    const countedJsonFiles = countJsonFiles(filesData);
    expect(countedJsonFiles).toEqual(2);
  });

  it('Should find [BAD] keys', async () => {
    const [filesData, duplicatedKeys] = await getAllFilesData(dir);
    const countedJsonFiles = countJsonFiles(filesData);
    const filesNames = await loadFilesNames(directoryPath);
    const filesContent = await loadFilesContent(filesNames, dir);
    const keyList = createKeysList(filesContent[0]);
    const countedBadKeys = countKeysInFiles(keyList);
    const errors = findBadKeys(
      countedBadKeys,
      countedJsonFiles,
      filesData,
      duplicatedKeys
    );

    errors.map(error => {
      expect(error).toHaveProperty('type');
      expect(error).toHaveProperty('key');
      expect(error).toHaveProperty('fileName');
    });
  });
  // Disable console usage linting errors as here error logging is performed.
  /* eslint-disable no-console */
  it('Should print results', async () => {
    const [filesData, duplicatedKeys] = await getAllFilesData(dir);
    const countedJsonFiles = countJsonFiles(filesData);
    const filesNames = await loadFilesNames(directoryPath);
    const filesContent = await loadFilesContent(filesNames, dir);
    const keyList = createKeysList(filesContent[0]);
    const countedBadKeys = countKeysInFiles(keyList);
    const errors = findBadKeys(
      countedBadKeys,
      countedJsonFiles,
      filesData,
      duplicatedKeys
    );

    console.error = jest.fn();
    printResult(errors);
    await expect(console.error).toHaveBeenCalledTimes(3);
  });

  /* eslint-enable no-console */
});
