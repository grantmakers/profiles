$(document).ready(function() {
  // Stitch

  // Tags
  function tags() {
    const clientPromise = stitch.StitchClientFactory.create('tags-lmqzn');
    const targetEIN = $('h1.org-name').data('ein').toString();

    $('.chips').chips();

    let client;
    let db;

    function displayTagsOnLoad() {
      clientPromise.then(stitchClient => {
        client = stitchClient;
        db = client.service('mongodb', 'mongodb-atlas').db('grantmakers');
        console.log('Connected to tags data source');
        return client.login().then(displayTags);
      });
    }

    function displayTags() {
      db.collection('tags').findOne({'_id': targetEIN}).then(docs => {
        if (docs) {
          const tagData = docs.tags;
          const html = tagData.map(c => '<div class="chip">' + c.term + '</div>').join('');
          document.getElementById('tags').innerHTML = html;
          console.log('Tags fetched successfully');
        }
      });
    }

    displayTagsOnLoad();
  }
  tags();
});
