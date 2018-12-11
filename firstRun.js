const _ = require("lodash");
const results = require("./results.json");

// Check User Exists
const matchedUser = _.find(results, { id: "2316058075133090", city: "à Nội" });

console.log(matchedUser);
