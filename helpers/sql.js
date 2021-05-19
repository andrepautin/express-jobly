const { BadRequestError } = require("../expressError");

/** 
 * Returns an object that can be used in an update sql query when destructed
 * Makes it possible to dynamically update a variable number of table fields
 * 
 * Accepts two objects =>
 *  
 * => dataToUpdate = {formFieldNames: formValues} 
 * e.g for a user update it could be 
 * ==> {firstName:"Carrie", lastName:"Grant", ...}
 * e.g for a company update it could be 
 * ==> {name:"New Comp Name", numEmployees: 3, ...}
 * 
 * => jsToSql = {formFieldNames: equivalentSqlColName}
 * e.g user update example 
 * ==> {firstName: "first_name", lastName:"last_name", ...}
 * e.g company update example
 * ==> {name:"name", numEmployees:"num_employees", ...}
 * 
 * Returns a new object =>
 * {setCols: queryStringFromData, values: dataToUpdateValues}
 * user update example:
 * ==> {setCols:'"first_name"=$1, "last_name":$2, ...', values:["Carrie","Grant", ...]}
 * company update example:
 * ==> {setCols:'"name"=$1, "num_employees"=$2, ...', values:["New Comp Name", 3, ...]}
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
