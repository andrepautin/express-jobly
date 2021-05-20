"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO companies(
          handle,
          name,
          description,
          num_employees,
          logo_url)
           VALUES
             ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
      [
        handle,
        name,
        description,
        numEmployees,
        logoUrl,
      ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies. 
   * If filters provided finds all companies matching filters
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */
  //TODO: fix filter function
  static async findAll(filters = {}) {
    console.log("FILTERS--->", filters);
    let baseQuery = `SELECT handle,
                            name,
                            description,
                            num_employees AS "numEmployees",
                            logo_url AS "logoUrl"
                            FROM companies`
    // console.log("model filters!", filters)
    const { whereExpression, values } = Company._sqlForCompanyFilterSearch(filters);
    if (whereExpression !== "") {
      baseQuery += whereExpression;
    }
    baseQuery += " ORDER BY name";
    // console.log("model post function", queryFilter)  
    console.log("BASE QUERY--->", baseQuery);
    const allCompanies = await db.query(baseQuery, values);
    return allCompanies.rows;
  }
  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
      `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
      [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
      UPDATE companies
      SET ${setCols}
        WHERE handle = ${handleVarIdx}
        RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }

  // ========================== HELPER FUNCTIONS ======================
  /** Used for company filtering sql, pass in filter data 
 * and it will return an object containing the sql query statement
 * and the values to be passed in when using db.query
 * 
 * e.g {name:"No", minEmployees:"2", maxEmployees:"3"} 
 * ==> {whereCols:'name ILIKE $1 AND num_employees >= min AND max >= num_employees',
 *  values: '%No%'}
 * 
 * e.g {name:"no", maxEmployees: "3"} 
 * ==> {whereCols: 'name ILIKE $1 AND 3 >= num_employee
 *  values: '%no%'}
 * 
 */
  //TODO: find better way to return only needed data/ move to model as method (rename with _sql... to signal internal use)
  //(b/c it affects others using this function)
  static _sqlForCompanyFilterSearch(filterData) {

    // console.log("filter ran! filter Data =>", filterData)
    const { name, minEmployees, maxEmployees } = filterData; //["name", "minEmployees", "maxEmployees"]
    let values = [];
    let whereClauses = [];
    let whereExpression = ""

    if (name) {
      values.push(`%${name}%`);
      whereClauses.push(`name ILIKE $${values.length}`);
    };

    if (minEmployees) {
      values.push(minEmployees);
      whereClauses.push(`num_employees >= $${values.length}`);
    };

    if (maxEmployees) {
      values.push(maxEmployees)
      whereClauses.push(`num_employees <= $${values.length}`);
    }

    if (whereClauses.length > 0) {
      whereExpression = " WHERE " + whereClauses.join(" AND ");
    }
    return { whereExpression, values };
  }
}


module.exports = Company;
