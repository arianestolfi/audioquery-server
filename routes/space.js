const express = require('express'),
      fs = require('fs'),
      path = require('path'),
      https = require('https'),
      _ = require('lodash');

const router = express.Router();


const stringFromQuery = (queryObj) => {
  const queryStr =
    _.join(_.map( _.pairs(queryObj),
                  pair => _.join(_.map(pair, encodeURIComponent), '='), '&'));
  return queryStr ? '?' + queryStr : '';
};

router.all('/space',() => console.log('spacespace!'));


router.get('/*', (req, resp, next) => {
  var dirfiles = ".." +"/client/index.html";

  resp.sendFile( path.join(__dirname, dirfiles)); // updated to reflect dir structure
});

module.exports = router;
