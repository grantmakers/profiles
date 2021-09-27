/**
 * Splits the aggregated JSON file into individual JSON files per EIN
 * Files are then available to Jekyll in the _data folder
 * 
 * TODO Lots of opportunities to simplify - good first pull request 😉
 */
const {chain}  = require('stream-chain');
const {parser} = require('stream-json');
const {streamArray} = require('stream-json/streamers/StreamArray');
const fs   = require('fs');

try {
  const pipeline = chain([
    fs.createReadStream('aggregated.json'),
    parser(),
    streamArray(),
    data => {
      const doc = data.value;
      return doc;
    },
  ]);
  
  let counter = 0;
  pipeline.on('data', (data) => {
    fs.writeFileSync('ein/' + data.ein + '.json', JSON.stringify(data), 'utf-8');
  });
  pipeline.on('end', () => {
    console.log(`Processed ${counter} documents.`);
  });
} catch (error) {
  console.log(error);
}
