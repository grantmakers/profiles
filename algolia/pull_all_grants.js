db.normalized.aggregate([  
  { 
    $match: {
      //'normalized.ein': '521798711'
      //'normalized.ein': { $in: ['050509502', '521798711', '131684331'] }
    }
  },
  {
    $unwind: {
      path: '$normalized.grants',
      includeArrayIndex: 'index_for_objectID',
      preserveNullAndEmptyArrays: false,
    }
  },
  {
    $project: {
      '_id': 0,
      'ein': '$normalized.ein',
      'organization_name': '$normalized.organization_name',
      'city': '$normalized.city',
      'state': '$normalized.state',
      'tax_year': '$normalized.tax_year',
      'grant_amount': '$normalized.grants.amount',
      'grant_purpose': '$normalized.grants.purpose',
      'grantee_name': '$normalized.grants.name',
      'grantee_city': '$normalized.grants.city',
      'grantee_state': '$normalized.grants.state',
      'index_for_objectID': 1,
    },
  }
]).forEach(function(x){
  let newID = x.ein + '_' + x.tax_year + '_' + x.index_for_objectID;
  x.objectID = newID;
  x._id = newID;
  x.grant_number = x.index_for_objectID + 1;
  delete x.index_for_objectID;
  db.grants.insert(x);
});

// mongoexport --db irs --collection grants --out grants.json --jsonArray
