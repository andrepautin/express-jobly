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

// /** Used for company filtering sql, pass in filter data 
//  * and it will return an object containing the sql query statement
//  * and the values to be passed in when using db.query
//  * 
//  * e.g {name:"No", minEmployees:"2", maxEmployees:"3"} 
//  * ==> {whereCols:'name ILIKE $1 AND num_employees >= min AND max >= num_employees',
//  *  values: '%No%'}
//  * 
//  * e.g {name:"no", maxEmployees: "3"} 
//  * ==> {whereCols: 'name ILIKE $1 AND 3 >= num_employee
//  *  values: '%no%'}
//  * 
//  */
// //TODO: find better way to return only needed data/ move to model as method (rename with _sql... to signal internal use)
// //(b/c it affects others using this function)
// function sqlForCompanyFilterSearch(filterData) {
//   // console.log("filter ran! filter Data =>", filterData)
//   const {name, minEmployees, maxEmployees} = filterData; //["name", "minEmployees", "maxEmployees"]
//   let values = [];
//   let whereClauses = [];

//   if (name){
//     values.push(`%${name}%`);
//     whereClauses.push(`name ILIKE $${values.length}`);
//   };

//   if (minEmployees){
//     values.push(minEmployees);
//     whereClauses.push(`num_employees >= $${values.length}`);
//   };

//   if (maxEmployees){
//     values.push(maxEmployees)
//     whereClauses.push(`num_employees <= $${values.length}`);
//   }


//   return {whereCols: " WHERE " + whereClauses.join("AND "), values};
// }

module.exports = { sqlForPartialUpdate };


