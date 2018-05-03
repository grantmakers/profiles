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
        let html;
        if (docs && docs.tags[0]) {
          const tagData = docs.tags;
          html = tagData.map(c => '<div class="chip">' + c.term + '</div>').join('');
          console.log('Tags fetched successfully');
        } else {
          html = 'No tags available for this funder';
        }
        document.getElementById('tags').innerHTML = html;
      });
    }

    displayTagsOnLoad();
  }
  tags();
});
