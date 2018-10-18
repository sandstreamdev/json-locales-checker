const compareLangKeys = () => {
  // lib is needed to show deuplicated keys
  const jsonValidator = require('json-dup-key-validator');

  //requiring path and fs modules
  const path = require('path');
  const fs = require('fs');
  const directoryPath = path.join(__dirname, 'locales');

  const mapAllFiles = (files, filesContent) => {
    const isJsonFile = (JSONdata, file) => {
      const singleFilesContent = [];

      for (const key in JSONdata) {
        singleFilesContent.push(key);
      }
      filesContent.push({
        fileName: file,
        fileKeys: singleFilesContent
      });
    };

    const isNotJsonFile = () => {
      notJSON++;
      filesContent.push({
        fileName: 'null',
        fileKeys: []
      });
    };

    const loadFiles = (file, isJsonFile, isNotJsonFile) => {
      // load file if it is a JSON
      if (file.includes('.json')) {
        const JSONdata = require(`./locales/${file}`);

        const isDuplicated = new Promise((resolve, reject) => {
          fs.readFile(`./locales/${file}`, 'utf8', (err, data) => {
            if (err) {
              reject(err);
            } else {
              const validateDuplicates = jsonValidator.validate(data, false);
              if (validateDuplicates) {
                resolve(
                  `[DUPLICATED] ${jsonValidator.validate(
                    data,
                    false
                  )} => in ${file}`
                );
              }
            }
          });
        });
        isDuplicated.then(res => {
          console.info(res);
        });
        isDuplicated.catch(rej => {
          console.info(rej);
        });

        isJsonFile(JSONdata, file);
      } else {
        isNotJsonFile;
      }
    };

    files.forEach(file => {
      loadFiles(file, isJsonFile, isNotJsonFile);
    });
  };
  const countKeysBetweenFiles = filesContent => {
    const singleFinalKeysArr = [];
    for (const key in filesContent) {
      const filesContentKeys = filesContent[key]['fileKeys'];
      for (const k in filesContentKeys) {
        singleFinalKeysArr.push(filesContentKeys[k]);
      }
    }
    const map = singleFinalKeysArr.reduce((prev, cur) => {
      prev[cur] = (prev[cur] || 0) + 1;
      return prev;
    }, {});

    return map;
  };

  const countNotJsonFiles = files => {
    let nonJson = 0;
    files.forEach(f => {
      if (!f.includes('.json')) {
        nonJson++;
      }
    });
    return nonJson;
  };

  const dspFinalResults = (finalCountedKeys, jsonFiles, filesContent) => {
    for (const key in finalCountedKeys) {
      // console.log(notJSON)
      if (finalCountedKeys[key] < jsonFiles) {
        const bad_val = `[BAD] ${key}`;

        for (const k in filesContent) {
          // in case Key not seen

          const filesContentKeys = filesContent[k]['fileKeys'];
          const fileNameFromK = filesContent[k];
          const { fileName } = fileNameFromK;
          if (
            filesContentKeys.length !== 0 &&
            !filesContentKeys.includes(key)
          ) {
            console.info(`${bad_val} => not seen in ${fileName}`);
          }
          for (const n in filesContentKeys) {
            // throw file name with [BAD]
            if (
              key === filesContentKeys[n] &&
              !filesContentKeys.includes(key)
            ) {
              console.info(`${bad_val} => in ${fileName}`);
            }
          }
        }
      }
    }
  };

  fs.readdir(directoryPath, (err, files) => {
    //handling error
    if (err) {
      return console.info('Unable to scan directory: ' + err);
    }

    const filesContent = []; // final array with the keys from JSON files
    const noJsonFiles = countNotJsonFiles(files);
    const jsonFiles = files.length - noJsonFiles; // only JSON files

    // 1. Map all the files and make one object with the name and content of the file
    mapAllFiles(files, filesContent);

    // 2. count number of the same keys between files
    const finalCountedKeys = countKeysBetweenFiles(filesContent);

    // 3. check and display results
    dspFinalResults(finalCountedKeys, jsonFiles, filesContent);
  });
};

compareLangKeys();
