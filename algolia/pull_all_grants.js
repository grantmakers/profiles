db.normalized.aggregate([  
  { 
    $match: {
      'normalized.ein': '521798711'
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
      '_tags': ['$normalized.ein'],
      //'assets': '$normalized.assets',
      //'website': '$normalized.website',
      //'has_website': '$normalized.has_website',
      //'grant_max': '$normalized.grant_max',
      //'grant_min': '$normalized.grant_min',
      //'grant_median': '$normalized.grant_median',
      //'grant_count': '$normalized.grant_count',
    },
  }
]).forEach(function(x){
  const newID = x.ein + '_' + x.tax_year + '_' + x.index_for_objectID;
  x.objectID = newID;
  x._id = newID;
  x.grant_number = x.index_for_objectID + 1;
  delete x.index_for_objectID;
  db.grants.insert(x);
});

// mongoexport --db irs --collection grants --out grants.json --jsonArray
